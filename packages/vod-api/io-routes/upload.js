var fs = require('fs');
var path = require('path');
var os = require('os');
var mkdirp = require('mkdirp');
var db = require('../models');

var CHUNK_SIZE = 1048576;

function getRootUploadFolder() {
  return path.join(os.tmpdir(), 'upload');
}

function getUploadFile(id) {
  return path.join(getRootUploadFolder(), id);
}

function UploadData(user, socket) {
  this.user = user;
  this.socket = socket;

  var self = this;

  this.onDisconnect = function() {
    if (self.step === 'upload') {
      self.uploadErrorHandler();
    }
  }

  this.uploadErrorHandler = function(err) {
    if (err) {
      console.error(err);
    }
    try {
      self.socket.emit('error', {
        status: 500,
        message: 'שגיאה בשרת',
      });
      self.socket.disconnect();
    }
    catch (e) {}

    return;
  }

  this.initUpload = function(data) {
    mkdirp(getRootUploadFolder(), function(err) {
      if (err) {
        return self.uploadErrorHandler(err);
      }
      db.videos.initialCreate(self.user, {
        creator: self.user && self.user.id,
        channel: self.user && self.user.id,
        name: data.name.replace(/\.[^/.]+$/, ''),
      })
      .then(function(video) {
        self.id = video.id;
        return this.resumeOrStartUpload(data);
      })
      .catch(self.uploadErrorHandler);
    });
  }

  this.resumeOrStartUpload = function(data) {
    self.step = 'upload';
    self.upload = {
      size: data.size,
      data: '',
      downloaded: 0,
    };
    var progress = 0;
    fs.stat(getUploadFile(self.id), function(err, stats) {
      if(!err && stat.isFile()) {
        self.upload.downloaded = stat.size;
        progress = stat.size / CHUNK_SIZE;
      }
      fs.open(getUploadFile(self.id), "a", 0755, function (err, fd) {
        if (err) {
          return self.uploadErrorHandler(err);
        }
        else {
          self.upload.handler = fd;
          self.socket.emit('upload progress', {
            id: self.id,
            progress,
            chunk: 0,
          });
        }
      });
    });
  };

  this.continueUpload = function(data) {
    self.upload.downloaded += data.data.length;
    self.upload.data += data.data;
  
    // finished upload
    if (self.upload.downloaded === self.upload.size) {
      fs.write(self.upload.handler, self.upload.data, null, 'Binary', function(err) {
        if (err) {
          return self.uploadErrorHandler(err);
        }
        self.socket.emit('upload finish', {
          id: self.id,
        });
      });
    }
    // write from buffer to file
    else if (self.upload.data.length > 10485760) {
      fs.write(self.upload.handler, self.upload.data, null, 'Binary', function (err, written) {
        if (err) {
          return self.uploadErrorHandler(err);
        }
        self.upload.data = '';
        var chunk = self.upload.downloaded / CHUNK_SIZE;
        var progress = (self.upload.downloaded / self.upload.size) * 100;
        self.socket.emit('upload progress', {
          id: self.id,
          progress,
          chunk,
        });
      });
    }
    // add to buffer
    else {
      var chunk = self.upload.downloaded / CHUNK_SIZE;
      var progress = (self.upload.downloaded / self.upload.size) * 100;
      if (progress >= 100) {
        self.socket.emit('upload finish', {
          id: self.id,
        });
      }
      else {
        self.socket.emit('upload progress', {
          id: self.id,
          progress,
          chunk,
        });
      }
    }
  };
}

function ioUpload(io) {
  io.of('/upload').on('connection', function (socket) {

    var uploadData = new UploadData(socket.user, socket);

    socket.on('start upload', uploadData.initUpload);

    socket.on('continue upload', uploadData.continueUpload);

    socket.on('disconnect', uploadData.onDisconnect);
  });
}

module.exports = ioUpload;

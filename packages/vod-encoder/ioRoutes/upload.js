var fs = require('fs');
var path = require('path');
var os = require('os');
var exec = require('child_process').exec;
var axios = require('axios');
var config = require('config');
var ffmpeg = require('fluent-ffmpeg');
var base64 = require('base64-img').base64;
var rimraf = require('rimraf');

var OSClient = require('vod-object-storage-client').GCSClient();

var CHUNK_SIZE = 1048576;
var MOCK_USER = 's7591665';

function getRootUploadFolder() {
  return os.tmpdir();
}

function getUploadFileFolder(id) {
  return path.join(getRootUploadFolder(), id); 
}

function getUploadFilePath(id) {
  return path.join(getUploadFileFolder(id), 'input.mp4'); 
}

function getEncodedFilePath(id) {
  return path.join(getUploadFileFolder(id), id);
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

  this.callback = function() {
    if (self.upload) {
      fs.close(self.upload.handler, function() {});
    }
    // self.socket.disconnect();
  };

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

    try {
      rimraf(getUploadFileFolder(self.id));
    }
    catch (e) {}
    return;
  }

  this.startUpload = function(data) {
    self.createUpload(data)
    .then(self.initUpload.bind(self, data))
    .catch(self.uploadErrorHandler);
  }

  this.createUpload = function(data) {
    return axios.post(`${config.api}/videos`, {
      creator: MOCK_USER,
      channel: MOCK_USER,
      name: data.name.replace(/\.[^/.]+$/, ''),
    });
  };

  this.initUpload = function(data, { data: { id } }) {
    self.socket.emit('setUploadId', { id });
    self.id = id;
    self.step = 'upload';
    self.upload = {
      size: data.size,
      data: '',
      downloaded: 0,
    };
    fs.exists(getUploadFileFolder(self.id), function(exists) {
      if (!exists) {
        return fs.mkdir(getUploadFileFolder(id), 0755, self.resumeOrStartUpload.bind(self));
      }
      self.resumeOrStartUpload();
    });
  }

  this.resumeOrStartUpload = function() {
    var progress = 0;
    try {
      var stat = fs.statSync(getUploadFilePath(self.id));
      if (stat.isFile()) {
        self.upload.downloaded = stat.size;
        progress = stat.size / CHUNK_SIZE;
      }
    }
    catch (err) {}
    fs.open(getUploadFilePath(self.id), "a", 0755, function (err, fd) {
      if (err) {
        // self.callback(err);
        return self.uploadErrorHandler(err);
      }
      else {
        self.upload.handler = fd;
        self.socket.emit('uploadProgress', {
          id: self.id,
          progress,
          chunk: 0,
        });
      }
    });
  };

  this.uploadProgress = function(data) {
    self.upload.downloaded += data.data.length;
    self.upload.data += data.data;
  
    // finished upload
    if (self.upload.downloaded === self.upload.size) {
      fs.write(self.upload.handler, self.upload.data, null, 'Binary', function(err) {
        if (err) {
          // self.callback(err);
          return self.uploadErrorHandler(err);
        }
        self.encodeVideo();
      });
    }
    // write from buffer to file
    else if (self.upload.data.length > 10485760) {
      fs.write(self.upload.handler, self.upload.data, null, 'Binary', function (err, written) {
        if (err) {
          // self.callback(err);
          return self.uploadErrorHandler(err);
        }
        self.upload.data = '';
        var chunk = self.upload.downloaded / CHUNK_SIZE;
        var progress = (self.upload.downloaded / self.upload.size) * 100;
        self.socket.emit('uploadProgress', {
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
        self.encodeVideo();
      }
      else {
        self.socket.emit('uploadProgress', {
          id: self.id,
          progress,
          chunk,
        });
      }
    }
  };

  this.takeVideoScreenshots = function(fileName, dir, callback, tryCount) {
    var screenshots = [];
    var posters = [];
    var tryCnt = tryCount || 0;
    var b64shots = [null, null, null, null];
    var finishedThumbnails = false;
    var finishedPosters = false;
    
    function checkCallback(err) {
      if (err) {
        if (tryCnt < 3) {
          return takeVideoScreenshots(fileName, dir, callback, tryCnt + 1);
        }
        return callback(err);
      }
      if (finishedPosters && finishedThumbnails) {
        callback(null, {
          posters,
          thumbnails: screenshots,
        });
      }
    }

    ffmpeg(fileName)
      .on('filenames', function(filenames) {
        screenshots = filenames.map(function(shot) {
          return path.join(dir, shot);
        });
      })
      .on('end', function() {
        finishedThumbnails = true;
        checkCallback();
        uploadVideoFile(
          self.id,
          'thumbnail.png',
          screenshots[self.selectedThumbnail],
        );

        screenshots.forEach(function(shot, index) {
          base64(shot, function(err, data) { 
            b64shots[index] = data;
            if (b64shots.length === screenshots.length) {
              console.log(b64shots);
              self.socket.emit('screenshots', {
                id: self.id,
                thumbnails: b64shots,
              });
            }
          })
        });
      })
      .outputOptions('-crf 27')
      .outputOptions('-preset veryfast')
      .screenshots({
        count: 4,
        size: '212x120',
        folder: dir,
        filename: `${self.id}-thumb%0i.png`,
      });
  
    ffmpeg(fileName)
      .on('filenames', function(filenames) {
        posters = filenames.map(function(shot) {
          return path.join(dir, shot);
        });
      })
      .on('end', function() {
        uploadVideoFile(
          self.id,
          'poster.png',
          posters[self.selectedThumbnail],
        );
        finishedPosters = true;
        checkCallback();
      })
      .outputOptions('-crf 27')
      .outputOptions('-preset veryfast')
      .screenshots({
        count: 4,
        size: '852x480',
        folder: dir,
        filename: `${self.id}-poster%0i.png`,
      });
  };

  this.uploadVideoToS3 = function() {
    var count = 0;
    self.step = 's3';
    var files = self.s3Files;
    Object.keys(files).forEach(function(file) {
      files[file].progress = 0;
      files[file].link = null;
    });
  
    var weights = {
      thumbnail: 0.5,
      poster: 1,
      mpd: 0.5,
      audio: 2,
      240: 4,
      360: 5,
      480: 8,
      720: 10,
      1080: 15,
    };
  
    function getFileExtension(file) {
      switch (file) {
        case 'thumbnail':
        case 'poster':
          return 'png';
        case 'mpd':
          return 'mpd';
        default:
          return 'mp4';
      }
    }
  
    function sendTotalProgress() {
      var total = 0;
      var avgProgress = Object.keys(files).reduce(function (sum, fileType){
        total += weights[fileType];
        return sum + (files[fileType].progress * weights[fileType]);
      }, 0);
      avgProgress /= total;
      self.socket.emit('s3Progress', { progress: avgProgress, id: self.id });
      return avgProgress;
    }
  
    var fileTypes = Object.keys(files).sort(function(type1, type2) {
      if (!weights[type2]) {
        return -1;
      }
      if (!weights[type1]) {
        return 1;
      }
      return weights[type1] - weights[type2];
    });

    var fileIndex = 0;
    var fileTypes = Object.keys(files);
    function uploadNext() {
      var fileType = fileTypes[fileIndex];
      var file = files[fileType].path;

      uploadVideoFile(
        self.id,
        `${fileType}.${getFileExtension(fileType)}`,
        file,
        function progressHandler(progress) {
          files[fileType].progress = ((progress.loaded / progress.total) * 40);
          sendTotalProgress();
        },
        function s3Callback(err, data) {
          if (err) {
            return self.uploadErrorHandler(err);
          }
          files[fileType].link = data.Location;
          files[fileType].progress = 100;
          sendTotalProgress();
          console.log('uploaded', fileType);
          fileIndex++;
          count++;
          if (fileIndex < fileTypes.length) {
            uploadNext();
          }
          else {
            uploaded = {};
            Object.keys(files).map(function(fileType) {
              return uploaded[fileType] = files[fileType].link;
            });
            self.postUpload(uploaded);
          }
        },
      );
    }
    
    uploadNext();
    // fileTypes.forEach(function(fileType) {
    //   var file = files[fileType].path;
    //   setTimeout(function() {
    //     uploadVideoFile(
    //       self.id,
    //       `${fileType}.${getFileExtension(fileType)}`,
    //       file,
    //       function progressHandler(progress) {
    //         files[fileType].progress = ((progress.loaded / progress.total) * 40);
    //         sendTotalProgress();
    //       },
    //       function s3Callback(err, data) {
    //         if (err) {
    //           return self.uploadErrorHandler(err);
    //         }
    //         files[fileType].link = data.Location;
    //         files[fileType].progress = 100;
    //         sendTotalProgress();
    //         console.log('uploaded', fileType);
    //         count++;
    //         if (count === fileTypes.length) {
    //           uploaded = {};
    //           Object.keys(files).map(function(fileType) {
    //             return uploaded[fileType] = files[fileType].link;
    //           });
    //           self.postUpload(uploaded);
    //         }
    //       },
    //     );
    //   }, weights[fileType] * 750);
    // });
  }

  this.postUpload = function (links) {
    console.log(links);
    self.step = 'draft';
    self.socket.emit('s3Finish', { id: self.id });
    self.callback();
  }

  this.encodeVideo = function() {
    self.inputFile = getUploadFilePath(self.id);
    self.outputFile = getEncodedFilePath(self.id);
  
    self.step = 'encode';
    self.socket.emit('uploadFinish', { id: self.id });
  
    self.encodedFiles = {
      audio: `${self.outputFile}-audio.mp4`,
      240: `${self.outputFile}-240.mp4`,
    };
  
    self.thumbnails = null;
    self.posters = null;
    self.selectedThumbnail = 0;
    
    ffmpeg.ffprobe(self.inputFile, function (err, metadata) {
      if (err) {
        return self.uploadErrorHandler(err);
      }
      else {
        var dims = metadata.streams
          .filter(function(stream) {
            return stream.codec_type === 'video';
          })
          .reduce(function(maxDims, stream) {
            var ratioW = stream.display_aspect_ratio.substring(0, stream.display_aspect_ratio.indexOf(':'));
            var ratioH = stream.display_aspect_ratio.substring(stream.display_aspect_ratio.indexOf(':') + 1);
            if ((ratioW /ratioH) < (maxDims.ratioW / maxDims.ratioH)) {
              ratioW = maxDims.ratioW;
              ratioH = maxDims.ratioH;
            }
            return {
              height: Math.max(maxDims.height, stream.height),
              width: Math.max(maxDims.width, stream.width),
              ratioW,
              ratioH,
            };
          }, {
            height: 0,
            width: 0,
            ratioW: 4,
            ratioH: 3,
          },
        );
        var resHeight = (dims.ratioW / dims.ratioH) * (9 / 16) * dims.height;
        var duration = metadata.format.duration;
        self.socket.emit('uploadMetadata', {
          id: self.id,
          metadata: {
            width: dims.width,
            height: dims.height,
            ratioW: dims.ratioW,
            ratioH: dims.ratioH,
            res: resHeight,
            duration,
          },
        });
        
        var encoding = ffmpeg(self.inputFile)
          /* ffmpeg -i <filename> -c:a aac -ac 2 -ab 128k -vn <output-audio> */
          .output(`${self.outputFile}-audio.mp4`)
          .audioCodec('aac')
          .audioChannels(2)
          .audioBitrate(128)
          .noVideo()
          .outputOptions('-crf 27')
          .outputOptions('-preset veryfast')
  
          /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 260k -maxrate 260k -bufsize 130k -vf scale=-2:240 <output-240> */
          .output(`${self.outputFile}-240.mp4`)
          .noAudio()
          .videoCodec('libx264')
          .videoBitrate(260)
          .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
          .outputOptions('-maxrate 260k')
          .outputOptions('-bufsize 130k')
          .outputOptions('-preset veryfast')
          .outputOptions('-crf 27')
          .size('?x240');
  
        if (resHeight >= 360) {
          self.encodedFiles[360] = `${self.outputFile}-360.mp4`;
          /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 600k -maxrate 600k -bufsize 300k -vf scale=-2:360 <output-360> */
          encoding
            .output(`${self.outputFile}-360.mp4`)
            .noAudio()
            .videoCodec('libx264')
            .videoBitrate(600)
            .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
            .outputOptions('-maxrate 600k')
            .outputOptions('-bufsize 300k')
            .outputOptions('-preset veryfast')
            .outputOptions('-crf 27')
            .size('?x360');
        }
        if (resHeight >= 480) {
          self.encodedFiles[480] = `${self.outputFile}-480.mp4`;
          /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 1060k -maxrate 1060k -bufsize 530k -vf scale=-2:480 <output-480> */
          encoding
            .output(`${self.outputFile}-480.mp4`)
            .noAudio()
            .videoCodec('libx264')
            .videoBitrate(1060)
            .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
            .outputOptions('-maxrate 1060k')
            .outputOptions('-bufsize 530k')
            .outputOptions('-preset veryfast')
            .outputOptions('-crf 27')
            .size('?x480');
        }
        if (resHeight >= 720) {
          self.encodedFiles[720] = `${self.outputFile}-720.mp4`;
          /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 2400k -maxrate 2400k -bufsize 1200k -vf scale=-2:720 <output-720> */
          encoding
            .output(`${self.outputFile}-720.mp4`)
            .noAudio()
            .videoCodec('libx264')
            .videoBitrate(2400)
            .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
            .outputOptions('-maxrate 2400k')
            .outputOptions('-bufsize 1200k')
            .outputOptions('-preset veryfast')
            .outputOptions('-crf 27')
            .size('?x720');
        }
        if (resHeight >= 1080) {
          self.encodedFiles[1080] = `${self.outputFile}-1080.mp4`;
          /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 5300k -maxrate 5300k -bufsize 2650k -vf scale=-2:1080 <output-1080> */
          encoding
            .output(`${self.outputFile}-1080.mp4`)
            .noAudio()
            .videoCodec('libx264')
            .videoBitrate(5300)
            .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
            .outputOptions('-maxrate 5300k')
            .outputOptions('-bufsize 2650k')
            .outputOptions('-bufsize 2650k')
            .outputOptions('-preset veryfast')
            .outputOptions('-crf 27')
            .size('?x1080');
        }
  
        encoding
          .on('progress', function (progress) {
            // console.log('Processing: ' + progress.percent + '% done');
            self.socket.emit('encodingProgress', {
              progress,
              id: self.id,
            });
          })
          .on('error', function (err, stdout, stderr) {
            // console.log('Cannot process video: ' + err.message);
            return self.uploadErrorHandler(err);
          })
          .on('end', function (stdout, stderr) {
            // console.log('Transcoding succeeded!');
            var mp4boxInputs = [];
            var mp4boxOutputs = {};
            Object.keys(self.encodedFiles).forEach(function(repId) {
              var fullPath = self.encodedFiles[repId];
              mp4boxInputs.push(`"${path.basename(fullPath)}":id=${repId}`);
              mp4boxOutputs[repId] = {
                path: path.join(getUploadFileFolder(self.id), `${repId}.mp4`),
              };
            });
            
            var mpdPath = path.join(getUploadFileFolder(self.id), 'mpd.mpd');
            var mp4boxCommand = `MP4Box -dash 1000 -rap -frag-rap -profile onDemand -segment-name "$RepresentationID$$Init=$" -out "${path.basename(mpdPath)}" ${mp4boxInputs.join(' ')}`;
            mp4boxOutputs.mpd = {
              path: mpdPath,
            };
            if (self.thumbnails) {
              mp4boxOutputs.thumbnail = {
                path: self.thumbnails[self.selectedThumbnail],
              };
            }
            if (self.posters) {
              mp4boxOutputs.poster = {
                path: self.posters[self.selectedThumbnail],
              };
            }
            self.s3Files = mp4boxOutputs;
  
            exec(mp4boxCommand, { cwd: getUploadFileFolder(self.id) }, function(err, stdout, stderr) {
              if (err) {
                return self.uploadErrorHandler(err);
              }
              self.socket.emit('encodingFinish', { id: self.id });
              self.uploadVideoToS3();
            })
          })
          .run();
          
          self.takeVideoScreenshots(
            self.inputFile,
            getUploadFileFolder(self.id),
            function(err, res) {
              console.error(err);
              self.thumbnails = res.thumbnails;
              self.posters = res.posters;
            },
          );
      }
    });
  };

  this.uploadScreenshot = function(index) {
    console.log(index);
    self.selectedThumbnail = index;
    console.log(self.thumbnails[self.selectedThumbnail]);
    if (self.thumbnails) {
      self.s3Files.thumbnail = {
        path: self.thumbnails[self.selectedThumbnail],
      };
      uploadVideoFile(self.id, 'thumbnail.png', self.posters[self.selectedThumbnail], null, console.log);
    }
    if (self.posters) {
      self.s3Files.poster = {
        path: self.posters[self.selectedThumbnail],
      };
      uploadVideoFile(self.id, 'poster.png', self.posters[self.selectedThumbnail]);
    }
  };
}

function uploadVideoFile(id, filename, path, progressHandler, callback) {
  // console.log(path);
  var stream = fs.createReadStream(path);
  var noop = function() {};
  OSClient.uploadVideo(
    id,
    filename,
    stream,
    progressHandler || noop,
    callback || noop,
  );
}

function ioUpload(io) {
  io.of('/upload').on('connection', function (socket) {
    // files[MOCK_USER] = files[MOCK_USER] || {};

    // var userFiles = files[MOCK_USER];
    var uploadData = new UploadData(MOCK_USER, socket);

    socket.on('uploadStart', uploadData.startUpload);

    socket.on('uploadStep', uploadData.uploadProgress);

    socket.on('uploadScreenshot', uploadData.uploadScreenshot);

    socket.on('disconnect', uploadData.onDisconnect);
  });
}

module.exports = ioUpload;

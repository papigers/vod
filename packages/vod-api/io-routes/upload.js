var subscribeUpload = require('../messages/upload').subscribeUpload;
var unsubscribeUpload = require('../messages/upload').unsubscribeUpload;
var db = require('../models');

function ioUpload(io) {
  io.of('/upload').on('connection', function(socket) {
    var subscriptions = [];
    var videoId = socket.handshake.query.id;
    var video = {};
    var progress = {
      encoding: 0,
    };

    function calculateProgress() {
      if (video.upload.step === 'FINISH') {
        return 100;
      }
      if (!video.upload.requiredFiles) {
        return progress.encoding * 0.85;
      }
      var uploadFileWeight = 1 / video.upload.requiredFiles;
      return Math.min(
        100,
        Object.keys(progress).reduce(function(prog, key) {
          if (key === 'encoding') {
            return prog + progress.encoding * 0.85;
          } else {
            return prog + (progress[key] || 0) * uploadFileWeight * 0.15;
          }
        }, 0),
      );
    }

    db.videos
      .getManagedVideos(socket.user, videoId)
      .then(function(videoData) {
        if (videoData.length) {
          video = videoData[0];
          socket.emit('init', video);
          if (!video.upload) {
            video.upload = {
              step: 'FINISH',
              id: video.id,
              uploadedFiles: [],
            };
          }
          if (video.upload.step === 'S3_UPLOAD' || video.upload.step === 'FINISH') {
            progress.encoding = 100;
          }
          video.upload.uploadedFiles.forEach(function(file) {
            progress[file] = 100;
          });
          socket.emit('progress', {
            progress: calculateProgress(),
            id: videoId,
          });
        } else {
          socket.emit('upload-error', 403);
          socket.disconnect();
        }
      })
      .catch(e => {
        console.error(e);
        socket.emit('upload-error', 500);
        socket.disconnect();
      });

    subscribeUpload(videoId, function onMessage(message) {
      switch (message.type) {
        case 'step':
          video.upload.step = message.step;
          if (message.file) {
            video.upload.uploadedFiles = video.upload.uploadedFiles
              .filter(function(file) {
                return file !== message.file;
              })
              .concat([message.file]);
            progress[message.file] = Math.max(progress[message.file] || 0, 100);
            socket.emit('step', {
              step: message.step,
              id: videoId,
            });
            socket.emit('progress', {
              progress: calculateProgress(),
              id: videoId,
            });
          }
        case 'progress':
          progress[message.headers.type] = Math.max(
            progress[message.headers.type] || 0,
            message.progress,
          );
          socket.emit('progress', {
            progress: calculateProgress(),
            id: videoId,
          });
          break;
        case 'metadata':
          var required = 5;
          var metadata = message.metadata;
          if (metadata.resolution >= 1080) {
            required = 9; // 1080 720 480 360 240 audio mpd poster thumb
          } else if (metadata.resolution >= 720) {
            required = 8;
          } else if (metadata.resolution >= 480) {
            required = 7;
          } else if (metadata.resolution >= 360) {
            required = 6;
          }
          video.upload.requiredFiles = required;
          socket.emit('progress', {
            progress: calculateProgress(),
            id: videoId,
          });
          socket.emit('metadata', {
            metadata,
            id: videoId,
          });
          break;
        default:
          break;
      }
    })
      .then(function(sub) {
        subscriptions.push(sub);
      })
      .catch(function(err) {
        console.error(e);
      });

    socket.on('disconnect', function() {
      subscriptions.forEach(function(sub) {
        unsubscribeUpload(sub);
      });
    });
  });
}

module.exports = ioUpload;

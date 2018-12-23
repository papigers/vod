// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var os = require('os');
var fs = require('fs');
var base64 = require('base64-img').base64;

var OSClient = require('@vod/vod-object-storage-client').S3Client();

var ensurePath = require('../utils/ensurePath');

var THUMBNAIL_QUEUE = 'thumbnail_queue';
var UPLOAD_QUEUE = 'upload_queue';

var connection = amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

function previewThumbnails(file, output, count) {
  return new Promise(function(resolve, reject) {
    var screenshots = [];
    ffmpeg(file)
      .on('filenames', function(names) {
        screenshots = names.map(function(name) {
          return path.join(output, name);
        });
      })
      .on('error', reject)
      .on('end', function() {
        Promise.all(
          screenshots.map(function(shot) {
            return new Promise(function(resolve, reject) {
              base64(shot, function(err, data) {
                if (err) {
                  return reject(err);
                }
                resolve(data);
              });
            });
          }),
        )
          .then(function(b64shots) {
            resolve(b64shots);
          })
          .catch(reject);
      })
      .outputOptions('-crf 27')
      .outputOptions('-preset veryfast')
      .screenshots({
        count: count,
        size: '212x120',
        folder: output,
        filename: 'thumb%0i.png',
      });
  });
}

function generateThumbnail(id, file, output, timestamp, thumbnail, poster) {
  var promises = [];
  if (thumbnail) {
    promises.push(
      new Promise(function(resolve, reject) {
        ffmpeg(file)
          .on('error', reject)
          .on('end', function() {
            channelWrapper
              .sendToQueue(UPLOAD_QUEUE, {
                id,
                path: path.join(output, 'thumbnail.png'),
              })
              .then(resolve)
              .catch(reject);
          })
          .outputOptions('-crf 27')
          .outputOptions('-preset veryfast')
          .screenshots({
            timestamps: [timestamp],
            size: '212x120',
            folder: output,
            filename: 'thumbnail.png',
          });
      }),
    );
  }
  if (poster) {
    promises.push(
      new Promise(function(resolve, reject) {
        ffmpeg(file)
          .on('error', reject)
          .on('end', function() {
            channelWrapper
              .sendToQueue(UPLOAD_QUEUE, {
                id,
                path: path.join(output, 'poster.png'),
              })
              .then(resolve)
              .catch(reject);
          })
          .outputOptions('-crf 27')
          .outputOptions('-preset veryfast')
          .screenshots({
            timestamps: [timestamp],
            size: '852x480',
            folder: output,
            filename: 'poster.png',
          });
      }),
    );
  }
  return Promise.all(promises);
}

function downloadVideo(id) {
  var file = path.join(os.tmpdir(), 'vod-cache', id);
  return new Promise(function(resolve, reject) {
    var cacheFileStream = fs.createWriteStream(file);
    cacheFileStream.on('finish', function() {
      resolve(file);
    });
    OSClient.serverGetObject(`video/${id}/360.mp4`)
      .on('error', reject)
      .pipe(cacheFileStream);
  });
}

function ensureVideoPath(videoId) {
  return new Promise(function(resolve, reject) {
    var uploadFile = path.join(os.tmpdir(), 'uploads', videoId);
    fs.exists(uploadFile, function(exists) {
      if (exists) {
        resolve(uploadFile);
      }
      var cacheFile = path.join(os.tmpdir(), 'vod-cache', videoId);
      fs.exists(cacheFile, function(exists) {
        if (exists) {
          resolve(cacheFile);
        }
        downloadVideo(videoId)
          .then(resolve)
          .catch(reject);
      });
    });
  });
}

function handleThumbnailMessage(type, body) {
  return new Promise(function(resolve, reject) {
    var outputFolder = path.join(os.tmpdir(), body.id);
    var cacheFolder = path.join(os.tmpdir(), 'vod-cache');
    return Promise.all([ensurePath(cacheFolder), ensurePath(outputFolder)]).then(function() {
      switch (type) {
        case 'PREVIEW_THUMBNAILS':
          ensureVideoPath(body.id)
            .then(function(path) {
              return previewThumbnails(path, outputFolder, body.count);
            })
            .then(resolve)
            .catch(function() {
              downloadVideo(body.id)
                .then(function(path) {
                  return previewThumbnails(path, outputFolder, body.count);
                })
                .then(resolve)
                .catch(reject);
            });
          break;
        case 'GENERATE_THUMBNAIL':
          ensureVideoPath(body.id)
            .then(function(path) {
              return generateThumbnail(
                body.id,
                path,
                outputFolder,
                body.timestamp,
                !!body.thumbnail,
                !!body.poster,
              );
            })
            .then(resolve)
            .catch(function() {
              downloadVideo(body.id)
                .then(function(path) {
                  return generateThumbnail(
                    body.id,
                    path,
                    outputFolder,
                    body.timestamp,
                    !!body.thumbnail,
                    !!body.poster,
                  );
                })
                .then(resolve)
                .catch(reject);
            });
        default:
          resolve({ error: 'Unrecognized Request ' });
      }
    });
  });
}

var channelWrapper = connection.createChannel({
  json: true,
  name: 'metadataChannel',
  setup(ch) {
    var self = this;
    return Promise.all([
      ch.assertQueue(THUMBNAIL_QUEUE, { durable: false }),
      ch.assertQueue(UPLOAD_QUEUE, { durable: true }),
      ch.prefetch(2),
      ch.consume(
        THUMBNAIL_QUEUE,
        function(msg) {
          return handleThumbnailMessage(msg.properties.type, JSON.parse(msg.content.toString()))
            .then(function(data) {
              return self.sendToQueue(msg.properties.replyTo, data, {
                correlationId: msg.properties.correlationId,
              });
            })
            .then(function() {
              ch.ack(msg);
            })
            .catch(function(e) {
              console.error(e);
              ch.nack(msg);
            });
        },
        { noAck: false },
      ),
    ]);
  },
});

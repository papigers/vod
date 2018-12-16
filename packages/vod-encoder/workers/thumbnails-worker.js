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

var connection =  amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

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
      Promise.all(screenshots.map(function(shot) {
        return new Promise(function(resolve, reject) {
          base64(shot, function(err, data) {
            if (err) {
              return reject(err);
            }
            resolve(data);
          });
        });
      }))
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

function downloadAndPreview(file, output, id, count) {
  return new Promise(function(resolve, reject) {
    var cacheFileStream = fs.createWriteStream(file);
    cacheFileStream.on('finish', function() {
      previewThumbnails(file, output, count).then(resolve).catch(reject);
    });
    OSClient.serverGetObject(`video/${id}/360.mp4`).on('error', function(error) {
      return resolve({ error });
    }).pipe(cacheFileStream);
  });
}

function handleThumbnailMessage(type, body) {
  return new Promise(function(resolve, reject) {
    var outputFolder = path.join(os.tmpdir(), body.id);
    var cacheFolder = path.join(os.tmpdir(), 'vod-cache');
    return Promise.all([ensurePath(cacheFolder), ensurePath(outputFolder)]).then(function() {
      switch(type) {
        case 'PREVIEW_THUMBNAILS':
          var cacheFile = path.join(cacheFolder, body.id);
          fs.exists(cacheFile, function(exists) {
            if (exists) {
              return previewThumbnails(cacheFile, outputFolder, body.count)
              .then(resolve)
              .catch(function() {
                return downloadAndPreview(cacheFile, outputFolder, body.id, body.count).then(resolve).catch(reject);
              });
            }
            return downloadAndPreview(cacheFile, outputFolder, body.id, body.count).then(resolve).catch(reject);
          });
          break;
        case 'GENERATE_THUMBNAIL':
          var promises = [];
          if (body.thumbnail) {
            promises.push(new Promise(function(resolve, reject) {
              ffmpeg(body.path)
              .on('error', reject)
              .on('end', function() {
                channelWrapper.sendToQueue(UPLOAD_QUEUE, {
                  id: body.id,
                  path: path.join(outputFolder, 'thumbnail.png'),
                }).then(resolve).catch(reject);
              })
              .outputOptions('-crf 27')
              .outputOptions('-preset veryfast')
              .screenshots({
                timestamps: [body.timestamp],
                size: '212x120',
                folder: outputFolder,
                filename: 'thumbnail.png',
              });
            }));
          }
          if (body.poster) {
            promises.push(new Promise(function(resolve, reject) {
              ffmpeg(body.path)
              .on('error', reject)
              .on('end', function() {
                channelWrapper.sendToQueue(UPLOAD_QUEUE, {
                  id: body.id,
                  path: path.join(outputFolder, 'poster.png'),
                }).then(resolve).catch(reject);
              })
              .outputOptions('-crf 27')
              .outputOptions('-preset veryfast')
              .screenshots({
                timestamps: [body.timestamp],
                size: '852x480',
                folder: outputFolder,
                filename: 'poster.png',
              });
            }));
          }
          return Promise.all(promises).then(resolve).catch(reject);
        default:
          resolve({ error: 'Unrecognized Request '});
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
      ch.consume(THUMBNAIL_QUEUE, function(msg) {
        return handleThumbnailMessage(msg.properties.type, JSON.parse(msg.content.toString()))
        .then(function(data) {
          return self.sendToQueue(msg.properties.replyTo, data, { correlationId: msg.properties.correlationId });
        })
        .then(function() {
          ch.ack(msg);
        })
        .catch(function(e) {
          console.error(e);
          ch.nack(msg);
        })
      }, { noAck: false }),
    ]);
  },
});

// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var os = require('os');
var base64 = require('base64-img').base64;

var ensurePath = require('../utils/ensurePath');

var THUMBNAIL_QUEUE = 'thumbnail_queue';
var UPLOAD_QUEUE = 'upload_queue';

var connection =  amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

function handleThumbnailMessage(type, body) {
  return new Promise(function(resolve, reject) {
    var outputFolder = path.join(os.tmpdir(), body.id);
    return ensurePath(outputFolder).then(function() {
      switch(type) {
        case 'PREVIEW_THUMBNAILS':
          var screenshots = [];
          ffmpeg(body.path)
          .on('filenames', function(names) {
            screenshots = names.map(function(name) {
              return path.join(outputFolder, name);
            });
          })
          .on('error', reject)
          .on('end', function() {
            Pomise.all(screenshots.map(function(shot) {
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
            count: body.count,
            size: '212x120',
            folder: outputFolder,
            filename: 'thumb%0i.png',
          });
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
        return handleThumbnailMessage(msg.properties.type, msg.content.toString())
        .then(function(data) {
          return self.sendToQueue(msg.properties.replyTo, data, { correlationId: msg.properties.correlationId });
        })
        .then(function() {
          ch.ack(msg);
        })
        .catch(function() {
          ch.nack(msg);
        })
      }, { noAck: false }),
    ]);
  },
});

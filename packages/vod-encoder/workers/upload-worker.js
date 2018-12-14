// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var path = require('path');
var fs = require('fs');
var OSClient = require('@vod/vod-object-storage-client').S3Client();

var publishProgress = require('../messages/progress');

var UPLOAD_QUEUE = 'upload_queue';

function uploadFile(videoId, file) {
  return new Promise(function(resolve, reject) {
    var stream = fs.createReadStream(file);
    OSClient.uploadVideo(
      videoId,
      path.basename(file),
      stream,
      function(progress) {
        var percent = (progress.loaded / progress.total) * 100;
        publishProgress(videoId, percent, `u${path.basename(file)}`);
      },
      function(err, data) {
        if (err) {
          return reject(err);
        }
        publishProgress(videoId, 100, `u${path.basename(file)}`);
        resolve(data);
      },
    );
  });
};

var connection = amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com'])

var channelWrapper = connection.createChannel({
  json: true,
  name: 'uploaderChannel',
  setup(ch) {
    return Promise.all([
      ch.assertQueue(UPLOAD_QUEUE, {durable: true}),
      ch.prefetch(1),
      ch.consume(UPLOAD_QUEUE, function(msg) {
        var data = JSON.parse(msg.content.toString());
        return uploadFile(data.id, data.path)
        .then(function(data) {
          console.log(data);
        })
        .then(function() {
          return ch.ack(msg);
        })
        .catch(function(err) {
          console.log(err);
          ch.nack(msg);
        });
      }, { noAck: false }),
    ]);
  },
});

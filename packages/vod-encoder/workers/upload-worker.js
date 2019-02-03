// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var path = require('path');
var fs = require('fs');
var axios = require('axios');
var config = require('config');
var OSClient = require('@vod/vod-object-storage-client').S3Client();

var publishProgress = require('../messages/upload').publishProgress;
var publishStep = require('../messages/upload').publishStep;

var UPLOAD_QUEUE = 'upload_queue';

function uploadFile(videoId, file) {
  return new Promise(function(resolve, reject) {
    var stream = fs.createReadStream(file);
    var filename = path.basename(file);
    OSClient.uploadVideo(
      videoId,
      filename,
      stream,
      function(progress) {
        var percent = (progress.loaded / progress.total) * 90;
        publishProgress(videoId, percent, filename);
      },
      function(err, data) {
        if (err) {
          return reject(err);
        }
        axios
          .put(`${config.api}/private/uploads/${videoId}/finish-uploading/${filename}`)
          .then(function({ data: step }) {
            publishStep(videoId, step, filename);
            publishProgress(videoId, 100, filename);
            resolve(data);
          });
      },
    );
  });
}

var connection = amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'uploaderChannel',
  setup(ch) {
    return Promise.all([
      ch.assertQueue(UPLOAD_QUEUE, { durable: true }),
      ch.prefetch(4),
      ch.consume(
        UPLOAD_QUEUE,
        function(msg) {
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
        },
        { noAck: false },
      ),
    ]);
  },
});

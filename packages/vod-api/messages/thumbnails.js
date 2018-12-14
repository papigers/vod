// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');

var THUMBNAIL_QUEUE = 'thumbnail_queue';

var connection = amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'encodeMessager',
  setup(ch) {
    return ch.assertQueue(THUMBNAIL_QUEUE, { durable: false });
  },
});

function generateThumbnail(videoId, path) {
  return new Promise(function(resolve, reject) {
    function replySetup(ch) {
      ch.assertQueue('', { exclusive: true, autoDelete: true })
      .then(function(q) {
        return ch.consume(q.queue, function(msg) {
          if (msg.properties.correlationId == videoId) {
            console.log(msg.content.toString());
            var data = JSON.parse(msg.content.toString());
            channelWrapper.removeSetup(replySetup);
            if (data.error) {
              return reject(data.error);
            }
            return resolve(data);
          }
        }, {noAck: true}).then(function() {
          return Promise.resolve(q);
        });
      }).then(function(q) {
        return channelWrapper.sendToQueue(
          THUMBNAIL_QUEUE,
          {
            thumbnail: true,
            poster: true,
            id: videoId,
            path,
            timestamp: '20%',
          },
          {
            correlationId: videoId,
            replyTo: q.queue,
            type: 'GENERATE_THUMBNAIL',
          },
        );
      });
    }
    return channelWrapper.addSetup(replySetup);
  });
}

function previewThumbnails(videoId, path) {
  return new Promise(function(resolve, reject) {
    function replySetup(ch) {
      ch.assertQueue('', { exclusive: true, autoDelete: true })
      .then(function(q) {
        return ch.consume(q.queue, function(msg) {
          if (msg.properties.correlationId == videoId) {
            var data = JSON.parse(msg.content.toString());
            channelWrapper.removeSetup(replySetup);
            if (data.error) {
              return reject(data.error);
            }
            return resolve(data);
          }
        }, {noAck: true}).then(function() {
          return Promise.resolve(q);
        });
      }).then(function(q) {
        return channelWrapper.sendToQueue(
          THUMBNAIL_QUEUE,
          {
            count: 4,
            path,
            id: videoId,
          },
          {
            correlationId: videoId,
            replyTo: q.queue,
            type: 'PREVIEW_THUMBNAILS',
          },
        );
      });
    }
    return channelWrapper.addSetup(replySetup);
  });
}

module.exports = {
  previewThumbnails,
  generateThumbnail,
};

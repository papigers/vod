// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var config = require('config');

var THUMBNAIL_QUEUE = 'thumbnail_queue';

var connection = amqp.connect([`amqp://${config.RabbitMQ.username}:${config.RabbitMQ.password}@${config.RabbitMQ.host}:${config.RabbitMQ.port}`]);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'encodeMessager',
  setup(ch) {
    return ch.assertQueue(THUMBNAIL_QUEUE, { durable: false, maxPriority: 1 });
  },
});

function generateThumbnail(videoId, timestamp, initial) {
  return new Promise(function(resolve, reject) {
    function replySetup(ch) {
      ch.assertQueue('', { exclusive: true, autoDelete: true })
        .then(function(q) {
          return ch
            .consume(
              q.queue,
              function(msg) {
                if (msg.properties.correlationId == videoId) {
                  var data = JSON.parse(msg.content.toString());
                  channelWrapper.removeSetup(replySetup, function() {});
                  if (data.error) {
                    return reject(data.error);
                  }
                  return resolve(data);
                }
              },
              { noAck: true },
            )
            .then(function() {
              return Promise.resolve(q);
            });
        })
        .then(function(q) {
          return channelWrapper.sendToQueue(
            THUMBNAIL_QUEUE,
            {
              thumbnail: true,
              poster: true,
              id: videoId,
              timestamp,
            },
            {
              correlationId: videoId,
              replyTo: q.queue,
              type: 'GENERATE_THUMBNAIL',
              priority: initial ? 1 : 0,
            },
          );
        });
    }
    return channelWrapper.addSetup(replySetup);
  });
}

function previewThumbnails(videoId, count) {
  return new Promise(function(resolve, reject) {
    function replySetup(ch) {
      ch.assertQueue('', { exclusive: true, autoDelete: true })
        .then(function(q) {
          return ch
            .consume(
              q.queue,
              function(msg) {
                if (msg.properties.correlationId == videoId) {
                  var data = JSON.parse(msg.content.toString());
                  if (data.error) {
                    return reject(data.error);
                  }
                  ch.deleteQueue(q.queue, { ifEmpty: true });
                  return resolve(data);
                }
              },
              { noAck: true },
            )
            .then(function() {
              channelWrapper.removeSetup(replySetup, function() {});
              return Promise.resolve(q);
            });
        })
        .then(function(q) {
          return channelWrapper.sendToQueue(
            THUMBNAIL_QUEUE,
            {
              count: count || 4,
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

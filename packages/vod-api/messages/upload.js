// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');

var VIDEO_UPLOAD_EXCHANGE = 'video_upload_exchange';

var connection = amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'videoUploadSubscriber',
  setup(ch) {
    return ch.assertExchange(VIDEO_UPLOAD_EXCHANGE, 'direct', { durable: false });
  },
});

function subscribeUpload(videoId, onMessage) {
  return new Promise(function(resolve, reject) {
    function replySetup(ch) {
      ch.assertQueue('', { exclusive: true, autoDelete: true })
        .then(function(q) {
          return ch
            .bindQueue(q.queue, VIDEO_UPLOAD_EXCHANGE, videoId)
            .then(function() {
              return Promise.resolve(q);
            })
            .catch(reject);
        })
        .then(function(q) {
          return ch
            .consume(
              q.queue,
              function(msg) {
                var data = JSON.parse(msg.content.toString());
                data.type = msg.properties.type;
                data.headers = msg.properties.headers;
                onMessage(data);
              },
              { noAck: true },
            )
            .then(function() {
              resolve({ queue: q.queue, setup: replySetup });
            })
            .catch(reject);
        })
        .catch(reject);
    }
    channelWrapper.addSetup(replySetup);
  });
}

function unsubscribeUpload(subscription) {
  return channelWrapper.removeSetup(subscription.setup, function(ch) {
    return ch.deleteQueue(subscription.queue).catch(function() {});
  });
}

module.exports = {
  subscribeUpload,
  unsubscribeUpload,
};

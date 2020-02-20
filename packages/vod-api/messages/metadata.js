// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');

var METADATA_QUEUE = 'metadata_queue';

var connection = amqp.connect(['amqp://admin:Aa123123@vod-ubuntu.westeurope.cloudapp.azure.com:5672']);
var channelWrapper = connection.createChannel({
  json: true,
  name: 'metadataRequester',
  setup(ch) {
    return ch.assertQueue(METADATA_QUEUE, { durable: true });
  },
});

function getVideoMetadata(path, id) {
  const corr = id;
  return new Promise(function(resolve, reject) {
    function replySetup(ch) {
      ch.assertQueue('', { exclusive: true, autoDelete: true })
        .then(function(q) {
          return ch
            .consume(
              q.queue,
              function(msg) {
                if (msg.properties.correlationId == corr) {
                  var data = JSON.parse(msg.content.toString());
                  channelWrapper.removeSetup(replySetup);
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
          return channelWrapper.sendToQueue(METADATA_QUEUE, path, {
            correlationId: corr,
            replyTo: q.queue,
          });
        });
    }
    return channelWrapper.addSetup(replySetup);
  });
}

module.exports = getVideoMetadata;

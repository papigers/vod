// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');

var ENCODE_QUEUE = 'encode_queue';

var connection = amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'encodeMessager',
  setup(ch) {
    return ch.assertQueue(ENCODE_QUEUE, { durable: true });
  },
});

function enqueueEncoding(videoId, path) {
  return channelWrapper.sendToQueue(ENCODE_QUEUE, {
    id: videoId,
    path,
  }, { persistent: true });
}

module.exports = enqueueEncoding;

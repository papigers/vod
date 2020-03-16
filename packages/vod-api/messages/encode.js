// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var config = require('config').RabbitMQ;

var ENCODE_QUEUE = 'encode_queue';

var connection = amqp.connect([`amqp://${config.username}:${config.password}@${config.host}:${config.port}`]);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'encodeMessager',
  setup(ch) {
    return ch.assertQueue(ENCODE_QUEUE, { durable: true });
  },
});

function enqueueEncoding(videoId, path) {
  console.log("Inside enquque encoding with video id " + videoId);
  return channelWrapper.sendToQueue(
    ENCODE_QUEUE,
    {
      id: videoId,
      path,
    },
    { persistent: true },
  );
}

module.exports = enqueueEncoding;

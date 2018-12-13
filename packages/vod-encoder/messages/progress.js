// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');

var PROGRESS_EXCHANGE = 'progress_exchange';

var connection = amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'progressPublisher',
  setup(ch) {
    return ch.assertExchange(PROGRESS_EXCHANGE, 'direct', { durable: false });
  },
});

function publishProgress(videoId, progress, type) {
  return channelWrapper.publish(PROGRESS_EXCHANGE, videoId, progress, { type });
}

module.exports = publishProgress;

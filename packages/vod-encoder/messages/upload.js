// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');

var VIDEO_UPLOAD_EXCHANGE = 'video_upload_exchange';

var connection = amqp.connect(['amqp://admin:Aa123123@vod-ubuntu.westeurope.cloudapp.azure.com:5672']);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'uploadPublisher',
  setup(ch) {
    return ch.assertExchange(VIDEO_UPLOAD_EXCHANGE, 'direct', { durable: false });
  },
});

function publishProgress(videoId, progress, type) {
  return channelWrapper.publish(
    VIDEO_UPLOAD_EXCHANGE,
    videoId,
    { progress },
    { type: 'progress', headers: { type } },
  );
}

function publishMetadata(videoId, metadata) {
  return channelWrapper.publish(VIDEO_UPLOAD_EXCHANGE, videoId, { metadata }, { type: 'metadata' });
}

function publishStep(videoId, step, file) {
  return channelWrapper.publish(VIDEO_UPLOAD_EXCHANGE, videoId, { step, file }, { type: 'step' });
}

module.exports = {
  publishProgress,
  publishMetadata,
  publishStep,
};

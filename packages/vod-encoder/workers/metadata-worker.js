// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var ffmpeg = require('fluent-ffmpeg');

var METADATA_QUEUE = 'metadata_queue';

var connection =  amqp.connect(['amqp://admin:Aa123123@vod-rabbitmq.westeurope.cloudapp.azure.com']);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'metadataChannel',
  setup(ch) {
    var self = this;
    return Promise.all([
      ch.assertQueue(METADATA_QUEUE, { durable: false }),
      ch.prefetch(2),
      ch.consume(METADATA_QUEUE, function(msg) {
        ffmpeg.ffprobe(msg.content.toString(), function (err, metadata) {
          if (err) {
            self.sendToQueue(
              msg.properties.replyTo,
              { error: err },
              { correlationId: msg.properties.correlationId },
            );
            return ch.ack(msg);
          }
          var dims = metadata.streams
          .filter(function(stream) {
            return stream.codec_type === 'video';
          })
          .reduce(
            function(maxDims, stream) {
              var ratioW = stream.display_aspect_ratio.substring(0, stream.display_aspect_ratio.indexOf(':'));
              var ratioH = stream.display_aspect_ratio.substring(stream.display_aspect_ratio.indexOf(':') + 1);
              if ((ratioW /ratioH) < (maxDims.ratioW / maxDims.ratioH)) {
                ratioW = maxDims.ratioW;
                ratioH = maxDims.ratioH;
              }
              return {
                height: Math.max(maxDims.height, stream.height),
                width: Math.max(maxDims.width, stream.width),
                ratioW,
                ratioH,
              };
            },
            {
              height: 0,
              width: 0,
              ratioW: 4,
              ratioH: 3,
            },
          );
  
          var resHeight = (dims.ratioW / dims.ratioH) * (9 / 16) * dims.height;
          var duration = metadata.format.duration;
  
          self.sendToQueue(
            msg.properties.replyTo,
            {
              width: dims.width,
              height: dims.height,
              ratioW: dims.ratioW,
              ratioH: dims.ratioH,
              res: resHeight,
              duration,
            },
            { correlationId: msg.properties.correlationId },
          );
          ch.ack(msg);
        });
      }, { noAck: false }),
    ]);
  },
});

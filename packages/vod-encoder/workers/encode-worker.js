// var amqp = require('amqplib');
var amqp = require('amqp-connection-manager');
var path = require('path');
var os = require('os');
var ffmpeg = require('fluent-ffmpeg');
var exec = require('child_process').exec;
var axios = require('axios');
var config = require('config');

var ensurePath = require('../utils/ensurePath');
var publishProgress = require('../messages/upload').publishProgress;
var publishMetadata = require('../messages/upload').publishMetadata;
var publishStep = require('../messages/upload').publishStep;

var ENCODE_QUEUE = 'encode_queue';
var UPLOAD_QUEUE = 'upload_queue';

function getOutputPath(videoId) {
  return path.join(config.TempStorage.path, videoId);
}

function encodeVideo(videoId, inputPath) {
  var outputPath = getOutputPath(videoId);
  var outputFile = path.join(outputPath, videoId);

  return ensurePath(outputPath).then(function() {
    return new Promise(function(resolve, reject) {
      var encodedFiles = {
        audio: `${outputFile}-audio.mp4`,
        240: `${outputFile}-240.mp4`,
      };

      ffmpeg.ffprobe(inputPath, function(err, metadata) {
        if (err) {
          return reject(err);
        } else {
          var dims = metadata.streams
            .filter(function(stream) {
              return stream.codec_type === 'video';
            })
            .reduce(
              function(maxDims, stream) {
                var ratioW, ratioH;
                if (!stream.display_aspect_ratio || stream.display_aspect_ratio === 'N/A') {
                  ratioW = stream.width;
                  ratioH = stream.height;
                } else {
                  ratioW = stream.display_aspect_ratio.substring(
                    0,
                    stream.display_aspect_ratio.indexOf(':'),
                  );
                  ratioH = stream.display_aspect_ratio.substring(
                    stream.display_aspect_ratio.indexOf(':') + 1,
                  );
                }
                if (ratioW / ratioH < maxDims.ratioW / maxDims.ratioH) {
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
          var resHeight = Math.round((dims.ratioW / dims.ratioH) * (9 / 16) * dims.height);
          var metadata = {
            height: dims.height,
            width: dims.width,
            resolution: resHeight,
            duration: metadata.format.duration,
            size: metadata.format.size,
          };

          return axios
            .put(`${config.api}/private/uploads/${videoId}/start-encoding`)
            .then(function({ data: step }) {
              publishStep(videoId, step);
              return axios.put(`${config.api}/private/videos/${videoId}/metadata`, {
                metadata,
              });
            })
            .then(function() {
              publishMetadata(videoId, metadata);

              console.log("Starting encoding...")
              var encoding = ffmpeg(inputPath)
                /* ffmpeg -i <filename> -c:a aac -ac 2 -ab 128k -vn <output-audio> */
                .output(`${outputFile}-audio.mp4`)
                .audioCodec('aac')
                .audioChannels(2)
                .audioBitrate(128)
                .noVideo()
                .outputOptions('-crf 27')
                .outputOptions('-preset veryfast')

                /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 260k -maxrate 260k -bufsize 130k -vf scale=-2:240 <output-240> */
                .output(`${outputFile}-240.mp4`)
                .noAudio()
                .videoCodec('libx264')
                .videoBitrate(260)
                .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
                .outputOptions('-maxrate 260k')
                .outputOptions('-bufsize 130k')
                .outputOptions('-preset veryfast')
                .outputOptions('-crf 27')
                .size('?x240');

              if (resHeight >= 360) {
                encodedFiles[360] = `${outputFile}-360.mp4`;
                /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 600k -maxrate 600k -bufsize 300k -vf scale=-2:360 <output-360> */
                encoding
                  .output(`${outputFile}-360.mp4`)
                  .noAudio()
                  .videoCodec('libx264')
                  .videoBitrate(600)
                  .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
                  .outputOptions('-maxrate 600k')
                  .outputOptions('-bufsize 300k')
                  .outputOptions('-preset veryfast')
                  .outputOptions('-crf 27')
                  .size('?x360');
              }
              if (resHeight >= 480) {
                encodedFiles[480] = `${outputFile}-480.mp4`;
                /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 1060k -maxrate 1060k -bufsize 530k -vf scale=-2:480 <output-480> */
                encoding
                  .output(`${outputFile}-480.mp4`)
                  .noAudio()
                  .videoCodec('libx264')
                  .videoBitrate(1060)
                  .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
                  .outputOptions('-maxrate 1060k')
                  .outputOptions('-bufsize 530k')
                  .outputOptions('-preset veryfast')
                  .outputOptions('-crf 27')
                  .size('?x480');
              }
              if (resHeight >= 720) {
                encodedFiles[720] = `${outputFile}-720.mp4`;
                /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 2400k -maxrate 2400k -bufsize 1200k -vf scale=-2:720 <output-720> */
                encoding
                  .output(`${outputFile}-720.mp4`)
                  .noAudio()
                  .videoCodec('libx264')
                  .videoBitrate(2400)
                  .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
                  .outputOptions('-maxrate 2400k')
                  .outputOptions('-bufsize 1200k')
                  .outputOptions('-preset veryfast')
                  .outputOptions('-crf 27')
                  .size('?x720');
              }
              if (resHeight >= 1080) {
                encodedFiles[1080] = `${outputFile}-1080.mp4`;
                /* ffmpeg -i <filename> -an -c:v libx264 -x264opts keyint=24:min-keyint=24:no-scenecut -b:v 5300k -maxrate 5300k -bufsize 2650k -vf scale=-2:1080 <output-1080> */
                encoding
                  .output(`${outputFile}-1080.mp4`)
                  .noAudio()
                  .videoCodec('libx264')
                  .videoBitrate(5300)
                  .outputOptions('-x264opts keyint=24:min-keyint=24:no-scenecut')
                  .outputOptions('-maxrate 5300k')
                  .outputOptions('-bufsize 2650k')
                  .outputOptions('-bufsize 2650k')
                  .outputOptions('-preset veryfast')
                  .outputOptions('-crf 27')
                  .size('?x1080');
              }

              encoding
                .on('progress', function(progress) {
                  // console.log('Processing: ' + progress.percent + '% done');
                  publishProgress(videoId, progress.percent, 'encoding');
                })
                .on('error', function(err, stdout, stderr) {
                  // console.log('Cannot process video: ' + err.message);
                  return reject(err);
                })
                .on('end', function(stdout, stderr) {
                  // console.log('Transcoding succeeded!');
                  publishProgress(videoId, 100, 'encoding');

                  var mp4boxInputs = [];
                  var mp4boxOutputs = {};
                  Object.keys(encodedFiles).forEach(function(repId) {
                    var fullPath = encodedFiles[repId];
                    mp4boxInputs.push(`"${path.basename(fullPath)}":id=${repId}`);
                    mp4boxOutputs[repId] = {
                      path: path.join(outputPath, `${repId}.mp4`)
                    };
                  });
                  
                  var mpdPath = path.join(outputPath, 'mpd.mpd');

                  var segmentName = "\\$RepresentationID\\$\\$Init=\\$";

                  // Check if the os is windows
                  if(os.type() === "Windows_NT"){
                    segmentName = "$RepresentationID$$Init=$";
                  }

                  var mp4boxCommand = `MP4Box -dash 1000 -rap -frag-rap -profile onDemand -segment-name "${segmentName}" -out "${path.basename(
                    mpdPath,
                  )}" ${mp4boxInputs.join(' ')}`;

                  mp4boxOutputs.mpd = {
                    path: mpdPath,
                  };

                  exec(mp4boxCommand, { cwd: outputPath }, function(err, stdout, stderr) {
                    if (err) {
                      console.log(err);
                      return reject(err);
                    }
                    return axios
                      .put(`${config.api}/private/uploads/${videoId}/finish-encoding`)
                      .then(function({ data: step }) {
                        publishProgress(videoId, 100, 'encoding');
                        publishStep(videoId, step);
                        resolve(mp4boxOutputs);
                      })
                      .catch(reject);
                  });
                })
                .run();
            })
            .catch(reject);
        }
      });
    });
  });
}

var connection = amqp.connect([`amqp://${config.RabbitMQ.username}:${config.RabbitMQ.password}@${config.RabbitMQ.host}:${config.RabbitMQ.port}`]);

var channelWrapper = connection.createChannel({
  json: true,
  name: 'encoderChannel',
  setup(ch) {
    var self = this;
    // return Promise.resolve(1);
    return Promise.all([
      ch.assertQueue(ENCODE_QUEUE, { durable: true }),
      ch.assertQueue(UPLOAD_QUEUE, { durable: true }),
      ch.prefetch(1),
      ch.consume(
        ENCODE_QUEUE,
        function(msg) {
          var data = JSON.parse(msg.content.toString());
          return encodeVideo(data.id, data.path)
            .then(function(paths) {
              return Promise.all(
                Object.keys(paths).map(function(file) {
                  var path = paths[file].path;
                  return self.sendToQueue(UPLOAD_QUEUE, {
                    id: data.id,
                    path,
                  });
                }),
              );
            })
            .then(function() {
              return ch.ack(msg);
            })
            .catch(function(err) {
              console.log(err);
              ch.nack(msg);
              //TODO
            });
        },
        { noAck: false },
      ),
    ]);
  },
});

'use strict';
var AWS = require('aws-sdk');
var fs = require('fs');

module.exports = S3Client;

function S3Client() {
  if (!(this instanceof S3Client)) {
    return new S3Client();
  }
  this.Bucket = 'bucketvod';
  this.S3 = new AWS.S3({
    region: 'eu-central-1',
  });
};

S3Client.prototype.getObject = function(req, callback) {
  var opts = {
      Bucket: this.Bucket,
      Key: `${req.params.videoId}/${req.params.object}`,
  };
  var header = null
  if ((header = req.header('range'))) {
      opts.Range = header;
  }
  if ((header = req.header('If-Modified-Since'))) {
      opts.IfModifiedSince = header;
  }
  if ((header = req.header('If-Unmodified-Since'))) {
      opts.IfUnmodifiedSince = header;
  }
  if ((header = req.header('If-Match'))) {
      opts.IfMatch = header;
  }
  if ((header = req.header('If-None-Match'))) {
      opts.IfNoneMatch = header;
  }
  var get = this.S3.getObject(opts);
  if (callback) {
      get.on('succes', function(res) {
      callback(null, res);
      });
      get.on('error', function(err) {
      callback(err, null);
      });
  }
  return get;
}

function uploadFile(config, progressHandler, callback) {
  if (typeof config.Body === 'string') {
    config.Body = fs.createReadStream(config.Body);
  }
  var upload = this.S3.upload(config);
  if (progressHandler) {
    upload.on('httpUploadProgress', progressHandler);
  }

  function callbackWrapper(err, data) {
    if (callback) {
      return callback(err, data);
    }
    console.error(err);
  }
  upload.send(callbackWrapper);
  return upload;
}

S3Client.prototype.uploadVideo = function(videoId, fileName, body, progressHandler, callback) {
  return uploadFile.call(this, {
    Bucket: this.Bucket,
    Key: `${videoId}/${fileName}`,
    Body: body,
  }, progressHandler, callback);
}

S3Client.prototype.uploadChannelImage = function(id, type, body, progressHandler, callback) {
  return uploadFile.call(this, {
    Bucket: this.Bucket,
    Key: `${id}/${type}.png`,
    Body: body,
  }, progressHandler, callback);
};

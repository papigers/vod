'use strict';
var AWS = require('aws-sdk');
var config = require('config');
var Client = require('./vod-object-storage-client');

module.exports = S3Client;

function S3Client() {
  if (!(this instanceof S3Client)) {
    return new S3Client();
  }
  Client.call(this);
  this.Bucket = config.S3.AWS_BUCKET;
  this.S3 = new AWS.S3({
    region: config.S3.AWS_REGION,
  });
  this.downloadS3 = this.S3;
  this.uploadS3 = this.S3;
}

S3Client.prototype = new Client();

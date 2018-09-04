'use strict';
var AWS = require('aws-sdk');
var Client = require('./vod-object-storage-client');

module.exports = GCSClient;

function GCSClient() {
  if (!(this instanceof GCSClient)) {
    return new GCSClient();
  }
  Client.call(this);
  this.Bucket = 'bucketvod';
  this.uploadS3 = new AWS.S3({
    endpoint: 'https://bucketvod.storage-upload.googleapis.com',
    s3BucketEndpoint: true,
    accessKeyId: process.env.GCS_ACCESS_KEY_ID,
    secretAccessKey: process.env.GCS_SECRET_ACCESS_KEY,
  });
  this.downloadS3 = new AWS.S3({
    endpoint: 'https://bucketvod.storage-download.googleapis.com',
    s3BucketEndpoint: true,
    accessKeyId: process.env.GCS_ACCESS_KEY_ID,
    secretAccessKey: process.env.GCS_SECRET_ACCESS_KEY,
  });
};

GCSClient.prototype = new Client();

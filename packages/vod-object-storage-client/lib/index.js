var S3Client = require('./s3-client');
var GCSClient = require('./gcs-client');

module.exports = S3Client;
S3Client.S3Client = S3Client;
S3Client.GCSClient = GCSClient;

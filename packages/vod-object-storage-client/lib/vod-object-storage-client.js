'use strict';
var fs = require('fs');
var mime = require('mime');

var provisionHeaders = [
  'content-length',
  'content-type',
  'content-range',
  'content-encoding',
  'accept-ranges',
  'etag',
  'cache-control',
  'last-modified',
];

module.exports = Client;

function Client() {
  if (!(this instanceof Client)) {
    return new Client();
  }
}

Client.prototype.proxyGetObject = function(clientRequest, httpRequest, httpResponse, next) {
  clientRequest.on('httpHeaders', function(statusCode, headers) {
    httpResponse.status(statusCode);
    provisionHeaders.forEach(function(header) {
      if (headers[header]) {
        httpResponse.set(header, headers[header]);
      }
      if (header === 'content-type' && headers[header] === 'application/octet-stream') {
        httpResponse.set(header, mime.getType(httpRequest.path));
      }
    });
    // if (!headers['cache-control']) {
    httpResponse.set('cache-control', 'private, max-age=86400');
    // }
  });
  var stream = clientRequest.createReadStream().on('error', function(err) {
    if (
      err.code === 'NotModified' ||
      (err.code === 'PreconditionFailed' && httpRequest.header('if-none-match'))
    ) {
      return httpResponse.sendStatus(304);
    }
    if (err.code === 'NoSuchKey') {
      return httpResponse.sendStatus(404);
    }
    return next(err);
  });

  stream.pipe(httpResponse);
};

Client.prototype.serverGetObject = function(key) {
  var opts = {
    Bucket: this.Bucket,
    Key: key,
  };
  return this.downloadS3.getObject(opts).createReadStream();
};

Client.prototype.getObject = function(opts, req, callback) {
  opts.Bucket = this.Bucket;
  var header = null;
  if ((header = req.header('range'))) {
    opts.Range = header;
  }
  if ((header = req.header('If-Modified-Since'))) {
    opts.IfModifiedSince = new Date(header);
  }
  if ((header = req.header('If-Unmodified-Since'))) {
    opts.IfUnmodifiedSince = new Date(header);
  }
  if ((header = req.header('If-Match'))) {
    opts.IfMatch = header;
  }
  if ((header = req.header('If-None-Match'))) {
    opts.IfNoneMatch = header;
  }
  var get = this.downloadS3.getObject(opts);
  if (callback) {
    get.on('succes', function(res) {
      callback(null, res);
    });
    get.on('error', function(err) {
      callback(err, null);
    });
  }
  return get;
};

Client.prototype.getVideoObject = function(req, callback) {
  var opts = {
    Key: `video/${req.params.videoId}/${req.params.object}`,
  };
  return this.getObject(opts, req, callback);
};

Client.prototype.getChannelObject = function(req, callback) {
  var opts = {
    Key: `channel/${req.params.channelId}/${req.params.img}`,
  };
  return this.getObject(opts, req, callback);
};

function uploadFile(opts, progressHandler, callback) {
  opts.Bucket = this.Bucket;
  if (typeof opts.Body === 'string') {
    opts.Body = fs.createReadStream(opts.Body);
  }
  var upload = this.uploadS3.upload(opts, {
    partSize: 5 * 1024 * 1024,
    queueSize: 30,
  });
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

Client.prototype.uploadVideo = function(videoId, fileName, body, progressHandler, callback) {
  return uploadFile.call(
    this,
    {
      Key: `video/${videoId}/${fileName}`,
      Body: body,
    },
    progressHandler,
    callback,
  );
};

Client.prototype.uploadChannelImage = function(id, type, body, progressHandler, callback) {
  return uploadFile.call(
    this,
    {
      Key: `channel/${id}/${type}.png`,
      Body: body,
    },
    progressHandler,
    callback,
  );
};

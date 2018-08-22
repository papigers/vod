var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('config');
var axios = require('axios');
var cors = require('cors');

var S3Client = require('vod-s3-client')();
var authCache = require('vod-redis-client')(config.cache.auth);

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));

function getUser(req) {
  return 's7591665';
}

app.get('/:videoId/:object',
  function checkAuthorized(req, res, next) {
    var cacheKey = `${req.params.videoId}/${getUser(req)}`;
    authCache.getAsync(cacheKey)
      .then(function(authorized) {
        if (authorized) {
          return Promise.resolve({ data: { authorized, cache: true } });
        }
        return axios.get(`${config.api}/videos/${req.params.videoId}/auth-check/${getUser(req)}`);  
      })
      .then(function({ data }) {
        if (!data.cache) {
          authCache.setAsync(cacheKey, data.authorized, 'EX', 10 * 60);
        }
        if (data.authorized) {
          return next();
        }
        return res.status(403).send('Unauthorized');
      })
      .catch(function(err) {
        console.error(err);
        return res.status(500).send('Server Error');
      });
  },
  function serveRequest(req, res) {
    // res.set('Cache-Control', 'max-age=43200');
    S3Client.getObject(req)
      .on('httpHeaders', function (statusCode, headers) {
        res.status(statusCode);
        res.set('Content-Length', headers['content-length']);
        res.set('Content-Range', headers['content-range']);
        res.set('Content-Type', headers['content-type']);
        res.set('Last-Modified', headers['last-modified']);
        res.set('ETag', headers['etag']);
        this.response.httpResponse.createUnbufferedStream().pipe(res);
      })
      .send();
    // S3Client.getObject(req).createReadStream().pipe(res);
  }
);

var x =  1;

module.exports = app;

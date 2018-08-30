var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('config');
var axios = require('axios');
var cors = require('cors');
var compression = require('compression');

var S3Client = require('vod-s3-client')();
var authCache = require('vod-redis-client')(config.cache.auth);

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));
app.use(compression());

function getUser(req) {
  return 's7591665';
}

var provisionHeaders = [
  'content-length',
  'content-type',
  'content-range',
  'content-encoding',
  'accept-ranges',
  'etag',
  'last-modified',
];

app.get('/:videoId/:object',
  function checkAuthorized(req, res, next) {
    var cacheKey = `video/${req.params.videoId}/${getUser(req)}`;
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
    S3Client.getVideoObject(req)
      .on('httpHeaders', function (statusCode, headers) {
        res.status(statusCode);
        provisionHeaders.forEach(function(header) {
          if (headers[header]) {
            res.set(header, headers[header])
          }
        });
        this.response.httpResponse.createUnbufferedStream().pipe(res);
      })
      .send();
  }
);

module.exports = app;

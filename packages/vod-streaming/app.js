var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('config');
var request = require('request-promise');
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
          return Promise.resolve({ authorized, cache: true });
        }
        return request.get({
          url: `${config.api}/videos/${req.params.videoId}/auth-check/${getUser(req)}`,
          json: true,
        });  
      })
      .then(function({ authorized, cache }) {
        if (!cache) {
          authCache.setAsync(cacheKey, authorized, 'EX', 5 * 60);
        }
        if (authorized) {
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
    S3Client.getObject(req).pipe(res);
  }
);

module.exports = app;

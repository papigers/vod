var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('config');
var axios = require('axios');
var cors = require('cors');
var compression = require('compression');
var auth = require('@vod/vod-auth');
var cookie = require('node-cookie');

var OSClient = require('@vod/vod-object-storage-client').S3Client();
// var authCache = require('@vod/vod-redis-client')(config.cache.auth);

var app = express();

app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:8000'],
  }),
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));
app.use(compression());
app.use(auth);

function getUser(req) {
  return req.user && req.user.id;
}

app.get(
  '/:videoId/:object',
  function checkAuthorized(req, res, next) {
    // var cacheKey = `video/${req.params.videoId}/${getUser(req)}`;
    var hasAuth = +cookie.get(req, `auth-${req.params.videoId}`, config.cookieSecret);
    if (hasAuth === 1) {
      return next();
    }
    return axios
      .get(`${config.api}/private/authz/view-video/${req.params.videoId}`, {
        headers: {
          Authorization: `bearer ${req.cookies.jwt}`,
        },
      })
      .then(function({ data }) {
        if (data.authorized) {
          var expire = new Date();
          expire.setSeconds(expire.getSeconds() + 30);
          cookie.create(
            res,
            `auth-${req.params.videoId}`,
            1,
            { maxAge: 30, httpOnly: true, expires: expire },
            config.cookieSecret,
          );
          return next();
        }
        return res.status(403).send('Unauthorized');
      })
      .catch(function(err) {
        console.error(err);
        return res.status(500).send('Server Error');
      });
    // authCache.getAsync(cacheKey)
    //   .then(function(authorized) {
    //     if (authorized) {
    //       return Promise.resolve({ data: { authorized, cache: true } });
    //     }
    //     return axios.get(`${config.api}/videos/${req.params.videoId}/auth-check/${getUser(req)}`);
    //   })
    //   .then(function({ data }) {
    //     if (!data.cache) {
    //       authCache.setAsync(cacheKey, data.authorized, 'EX', 24 * 60 * 60);
    //     }
    //     if (data.authorized) {
    //       return next();
    //     }
    //     return res.status(403).send('Unauthorized');
    //   })
    //   .catch(function(err) {
    //     console.error(err);
    //     return res.status(500).send('Server Error');
    //   });
  },
  function serveRequest(req, res, next) {
    OSClient.proxyGetObject(OSClient.getVideoObject(req), req, res, next);
  },
);

module.exports = app;

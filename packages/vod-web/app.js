var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var config = require('config');
var logger = require('morgan');
var compression = require('compression');
var axios = require('axios');

var OSClient = require('vod-object-storage-client').S3Client();
// var authCache = require('vod-redis-client')(config.cache.auth);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));
app.use(compression());


function getUser(req) {
  return 's7591665';
}

app.get('/profile/:channelId/:img',
  function checkAuthorized(req, res, next) {
    // var cacheKey = `video/${req.params.videoId}/${getUser(req)}`;
    return axios.get(`${config.api}/channels/${req.params.channelId}/auth-check/${getUser(req)}`)
      .then(function({ data }) {
        if (data.authorized) {
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
    //     return axios.get(`${config.api}/channels/${req.params.channelId}/auth-check/${getUser(req)}`);  
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
    OSClient.proxyGetObject(OSClient.getChannelObject(req), req, res, next);
  },
);

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}


module.exports = app;

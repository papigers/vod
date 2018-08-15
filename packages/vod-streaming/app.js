var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('config');
var request = require('request-promise');
var cors = require('cors')

var S3Client = require('vod-s3-client')();

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));

app.get('/:videoId/:object',
  function checkAuthorized(req, res, next) {
    request.get({
      url: `${config.api}/videos/${req.params.videoId}/auth-check/s7591665`,
      json: true,
    })
      .then(function({ authorized }) {
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

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var auth = require('@vod/vod-auth');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));
app.use(auth);

require('./workers/encode-worker');
require('./workers/upload-worker');
require('./workers/thumbnails-worker');

module.exports = app;

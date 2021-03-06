var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var compression = require('compression');
require('./clearPersistentStorage.js')

var app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      credentials: true,
      origin: ['http://localhost:3000', 'http://localhost:8000'],
    }),
  );
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));
app.use(compression());

var routes = require('./routes/index');
app.use('/', routes);

module.exports = app;
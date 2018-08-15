var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));

var apiRoute = require('./routes/index');
app.use('/api', apiRoute);

module.exports = app;

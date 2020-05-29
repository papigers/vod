var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//var cors = require('cors');
var compression = require('compression');

var app = express();
// TODO: enable in dev
// app.use(
//   cors({
//     // credentials: true,
//     origin: ['vod.army.idf', 'vod-api.army.idf']
//   })
// );

//app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookie-secret'));
app.use(compression());

var routes = require('./routes/index');
app.use('/', routes);

module.exports = app;
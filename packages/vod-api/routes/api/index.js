var express = require('express');
var router = express.Router();

var videos = require('./videos');
router.use('/videos', videos);

var channels = require('./channels');
router.use('/channels', channels);

// Only for B2B access
var private = require('./private');
router.use('/private', private);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

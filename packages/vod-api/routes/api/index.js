var express = require('express');
var router = express.Router();

var videos = require('./videos');
router.use('/videos', videos);

var channels = require('./channels');
router.use('/channels', channels);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
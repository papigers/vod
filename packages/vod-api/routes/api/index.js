var express = require('express');
var auth = require('vod-auth');
var router = express.Router();

// Only for B2B access - no auth required
// should prevent access from apache/nginx reverse proxy
var private = require('./private');
router.use('/private', private);

router.use(auth);

var videos = require('./videos');
router.use('/videos', videos);

var channels = require('./channels');
router.use('/channels', channels);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

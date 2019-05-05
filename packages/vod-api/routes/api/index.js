var express = require('express');
var auth = require('@vod/vod-auth');
var router = express.Router();

// Only for B2B access - no auth required
// should prevent access from apache/nginx reverse proxy
var private = require('./private');
router.use('/private', private);

router.use(auth);

var videos = require('./videos');
router.use('/videos', videos);

var upload = require('./upload');
router.use('/upload', upload);

var notifications = require('./notifications');
router.use('/notifications', notifications);

var channels = require('./channels');
router.use('/channels', channels);

var search = require('./search');
router.use('/search', search);

var playlists = require('./playlists');
router.use('/playlists', playlists);

var analytics = require('./analytics');
router.use('/analytics', analytics);

var workflows = require('./workflows');
router.use('/workflows', workflows);

var transactions = require('./transactions');
router.use('/transactions', transactions);

router.get('/profile', function(req, res) {
  res.json(req.user);
});

router.get(
  '/refreshtoken',
  function(req, res, next) {
    // res.clearCookie('jwt');
    next();
  },
  auth,
  function(req, res) {
    res.sendStatus(200);
  },
);

module.exports = router;

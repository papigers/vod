var express = require('express');
var router = express.Router();
var auth = require('vod-auth');
var db = require('../../models');

router.post('/user-login', function(req, res) {
  var user = req.body;
  db.channels.userLogin(user)
    .then(function([user]) {
      res.json(user);
    })
    .catch(function(err) {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/authz/view-channel/:channelId', auth, function(req, res) {
  res.setHeader('cache-control', 'public, max-age=86400');
  db.channels.checkAuth(req.params.channelId, req.user)
    .then(function({ count }) {
      res.json({
        authorized: count > 0,
      });
    })
    .catch(function(err) {
      console.error(err);
      res.json({
        authorized: false,
      });
    });
});

router.get('/authz/view-video/:videoId', auth, function(req, res) {
  res.setHeader('cache-control', 'public, max-age=86400');
  db.videos.checkAuth(req.params.videoId, req.user)
    .then(function({ count }) {
      res.json({
        authorized: count > 0,
      });
    })
    .catch(function(err) {
      console.error(err);
      res.json({
        authorized: false,
      });
    });
});

module.exports = router;

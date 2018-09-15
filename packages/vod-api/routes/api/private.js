var express = require('express');
var router = express.Router();
var Channel = require('../../models').Channel;
var Video = require('../../models').Video;

router.post('/user-login', function(req, res) {
  var user = req.body;
  Channel.userLogin(user)
    .spread(function(user) {
      res.json(user);
    })
    .catch(function(err) {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/authz/view-channel/:channelId/:userId', function(req, res) {
  res.setHeader('cache-control', 'public, max-age=86400');
  Channel.checkAuth(req.params.channelId, req.params.userId)
    .then(function(count) {
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

router.get('/authz/view-video/:videoId/:userId', function(req, res) {
  res.setHeader('cache-control', 'public, max-age=86400');
  Video.checkAuth(req.params.videoId, req.params.userId)
    .then(function(count) {
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

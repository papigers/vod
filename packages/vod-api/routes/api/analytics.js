var qs = require('querystring');
var express = require('express');
var db = require('../../models');
var router = express.Router();

router.get('/quota/channel', function(req, res, next) {
  var channel = req.query.id || req.user.id;
  db.channels
    .getQuotaStatus(req.user, channel)
    .then(function(results) {
      res.json(results);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.get('/stats', function(req, res, next) {
  const channels = req.query.channel || req.user.id;
  db.channels
    .getChannelStats(req.user, Array.isArray(channels) ? channels : [channels])
    .then(function(results) {
      res.json(results);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.get('/exposure', function(req, res, next) {
  const channels = req.query.channel || req.user.id;
  const video = req.query.video;
  const type = req.query.type;
  db.videos
    .getVideoExposure(req.user, Array.isArray(channels) ? channels : [channels], video, type)
    .then(function(results) {
      res.json(results);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
})

module.exports = router;

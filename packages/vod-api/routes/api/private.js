var express = require('express');
var router = express.Router();
var auth = require('@vod/vod-auth');
var db = require('../../models');

router.post('/user-login', function(req, res) {
  var user = req.body;
  db.channels
    .userLogin(user)
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
  db.channels
    .checkAuth(req.params.channelId, req.user)
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
  db.videos
    .checkAuth(req.params.videoId, req.user)
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

router.put('/videos/:videoId/metadata', function(req, res, next) {
  var metadata = req.body.metadata;
  return db.videos
    .setMetadata(req.params.videoId, metadata)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      next(err);
    });
});

router.put('/uploads/:videoId/start-encoding', function(req, res, next) {
  return db.uploads
    .startEncoding(req.params.videoId)
    .then(function() {
      res.status(200).send('ENCODE');
    })
    .catch(function(err) {
      next(err);
    });
});

router.put('/uploads/:videoId/finish-encoding', function(req, res, next) {
  return db.uploads
    .finishEncoding(req.params.videoId)
    .then(function() {
      res.status(200).send('S3_UPLOAD');
    })
    .catch(function(err) {
      console.log(err);
      res.status(200).send('FINISH');
      // next(err);
    });
});

router.put('/uploads/:videoId/finish-uploading/:file', function(req, res, next) {
  return db.uploads
    .finishUploading(req.params.videoId, req.params.file)
    .then(function(step) {
      res.status(200).send(step);
    })
    .catch(function(err) {
      console.log(err);
      res.status(200).send('FINISH');
      // next(err);
    });
});

module.exports = router;

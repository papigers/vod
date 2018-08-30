var os = require('os');
var fs = require('fs');
var path = require('path');
var express = require('express');
var multer = require('multer');
var Channel = require('../../models').Channel;
var router = express.Router();

var s3Client = require('vod-s3-client')();

var channelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    var dest = path.join(os.tmpdir(), req.body.id);
    fs.access(dest, function(err) {
      if (err) {
        fs.mkdir(dest, function(err) {
          cb(err, dest);
        });
      }
      cb(null, dest);
    });
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}.png`);
  }
});
var upload = multer({ storage: channelStorage });

router.get('/:id', function(req, res) {
  Channel.getChannel(req.params.id)
    .then(function(result) {
      if (result) {
        return res.json(result.get({ plain: true }));
      }
      return res.status(404).json({
        error: 'No such channel',
      });
    })
    .catch(function (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Couldn\'t get channel',
      });
    });
});

router.put('/:id', function(req, res) {
  Channel.editChannel(req.params.id, req.body)
    .then(function(result) {
      if (!!result) {
        return res.json({});
      }
      return res.status(404).json({
        error: 'No such channel',
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).json({
        error: 'Channel edit failed',
      });
    });
});

var channelImagesUpload = upload.fields([{
  name: 'profile',
  maxCount: 1,
}, {
  name: 'cover',
  maxCount: 1,
}]);

router.post('/', channelImagesUpload, function(req, res) {
  Channel.createChannel(req.body)
    .then(function(result) {
      s3Client.uploadChannelImage(result.get('id'), 'profile', req.files.profile[0].path);
      s3Client.uploadChannelImage(result.get('id'), 'cover', req.files.cover[0].path);
      return res.json({ id: result.get('id') });
    })
    .catch(function (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to create channel',
      });
    });
});

// default redirect to new uploads
router.get('/:id/videos', function(req, res) {
  res.redirect(`${req.baseUrl}/${req.params.id}/videos/new`);
});

router.get('/:id/videos/:sort', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  Channel.getChannelVideos(req.params.id, limit, offset, sort)
    .then(function(results) {
      return res.json(results);
    })
    .catch(function (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to get channel videos',
      });
    });
});

module.exports = router;

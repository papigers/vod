var express = require('express');
var Video = require('../models').Video;
var Channel = require('../models').Channel;
var router = express.Router();

// create new video - initial request.
/**
 * PARAMS
 * creator: creator channel id
 * channel: 
 */
router.post('/', function(req, res, next) {
  Video.initialCreate({
    creator: req.body.creator,
    channel: req.body.channel,
    name: req.body.name,
  }).then(function([video, created]) {
    res.json({
      id: video.get('id'),
    });
  }).catch(function(err) {
    res.status(500).json({
      error: 'Video creation failed',
    });
  });
});

router.get('/:id', function(req, res) {
  Video.viewGetVideo(req.params.id)
    .then(function(result) {
      if (result) {
        return res.json(result.get({ plain: true }));
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Couldn\'t get video',
      });
    })
});

router.put('/:id', function(req, res) {
  Video.edit(req.params.id, req.body)
    .then(function(result) {
      if (result[0] > 0) {
        return res.json({});
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function (err) {
      res.status(500).json({
        error: 'Video edit failed',
      });
    });
});

// finish video creation with all data.
router.put('/publish/:id', function(req, res, next) {
  Video.publish(req.params.id, req.body)
    .then(function(result) {
      if (result[0] > 0) {
        return res.json({});
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function (err) {
      res.status(500).json({
        error: 'Video publish failed',
      });
    });
});

router.get('/:videoId/auth-check/:userId', function(req, res) {
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

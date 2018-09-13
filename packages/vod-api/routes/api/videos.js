var express = require('express');
var qs = require('querystring');
var Video = require('../../models').Video;
var router = express.Router();

// default redirect to random
router.get('/', function(req, res) {
  res.redirect(`${req.baseUrl}/random?${qs.stringify(req.query)}`);
});

router.get('/:sort', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  Video.getVideos(limit, offset, sort)
    .then(function(videos) {
      res.json(videos.map(function([video, channel, viewCount]) {
        var res = video.get({ plain: true });
        delete res.channelId;
        res.channel = channel;
        res.viewCount = viewCount;
        return res;
      }));
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Couldn\'t fetch videos',
      });
    });
});

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
  }).then(function(video) {
    res.json({
      id: video.get('id'),
    });
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({
      error: 'Video creation failed',
    });
  });
});

router.get('/video/:id', function(req, res) {
  Video.getVideo(req.params.id)
    .then(function([video, channel, viewCount, likeCount, like]) {
      if (video) {
        var result = video.get({ plain: true });
        delete result.channelId;
        result.channel = channel;
        result.viewCount = viewCount;
        result.likeCount = likeCount;
        result.userLikes = like;
        return res.json(result);
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

router.put('/video/:id/view', function(req, res) {
  Video.viewVideo(req.params.id)
    .then(function() {
      return res.json({});
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to add video view',
      });
    });
});

router.put('/video/:id/like', function(req, res) {
  Video.likeVideo(req.params.id)
    .then(function() {
      return res.json({});
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to like video',
      });
    });
});

router.put('/video/:id/dislike', function(req, res) {
  Video.dislikeVideo(req.params.id)
    .then(function() {
      return res.json({});
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to dislike video',
      });
    });
});

router.put('/:id', function(req, res) {
  Video.edit(req.params.id, req.body)
    .then(function(result) {
      if (!!result) {
        return res.json(result.get({ plain: true }));
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).json({
        error: 'Video edit failed',
      });
    });
});

// finish video creation with all data.
router.put('/publish/:id', function(req, res, next) {
  Video.publish(req.params.id, req.body)
    .then(function(result) {
      if (!!result) {
        return res.json(result.get({ plain: true }));
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).json({
        error: 'Video publish failed',
      });
    });
});

router.delete('/:id', function(req, res) {
  Video.delete(req.params.id)
    .then(function(deleted) {
      if (deleted) {
        return res.json({});
      }
      return res.sendStatus(404);
    })
    .catch(function(err) {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/:videoId/auth-check/:userId', function(req, res) {
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

var express = require('express');
var qs = require('querystring');
var db = require('../../models');
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

  db.videos.getVideos(req.user, limit, offset, sort)
    .then(function(videos) {
      res.json(videos);
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
  db.videos.initialCreate(req.user, {
    creator: req.user && req.user.id,
    channel: req.body.channel,
    name: req.body.name,
  }).then(function(video) {
    res.json(video.id);
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({
      error: 'Video creation failed',
    });
  });
});

router.get('/video/:id', function(req, res) {
  db.videos.getVideo(req.user, req.params.id)
    .then(function(video) {
      if (video) {
        return res.json(video);
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
  db.videos.viewVideo(req.user, req.params.id)
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
  db.videos.likeVideo(req.user, req.params.id)
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
  db.videos.dislikeVideo(req.user, req.params.id)
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
  db.videos.edit(req.user, req.params.id, req.body)
    .then(function(result) {
      if (!!result) {
        return res.sendStatus(200);
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function (err) {
      res.status(err.code).json({
        error: err.message || 'Video edit failed',
      });
    });
});

// finish video creation with all data.
router.put('/publish/:id', function(req, res, next) {
  db.videos.publish(req.user, req.params.id, req.body)
    .then(function(result) {
      if (!!result) {
        return res.sendStatus(200);
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
  db.videos.delete(req.user, req.params.id)
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

router.get('/:videoId/comments', function(req, res, next) {
  var page = req.query.page || 0;
  var before = req.query.before ? new Date(req.query.before) : new Date();
  db.comments.getComments(req.user, req.params.videoId, { page, before })
    .then(function(comments) {
      res.json(comments);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.post('/:videoId/comments', function(req, res, next) {
  db.comments.postComment(req.user, req.params.videoId, req.body.comment)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

module.exports = router;

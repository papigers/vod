var express = require('express');
var Video = require('../../models').Video;
var router = express.Router();


function getVideos(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  Video.getVideos(limit, offset, sort)
    .then(function(videos) {
      res.json(videos);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Couldn\'t fetch videos',
      });
    });
};

// default redirect to random
router.get('/', function(req, res) {
  res.redirect(`${req.baseUrl}/random`);
});

router.get('/:sort', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  Video.getVideos(limit, offset, sort)
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

router.get('/view/:id', function(req, res) {
  Video.viewGetVideo(req.params.id)
    .then(function([video, viewCount, likeCount]) {
      if (video) {
        var result = video.get({ plain: true });
        result.viewCount = viewCount;
        result.likeCount = likeCount;
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
      if (!!result) {
        return res.json({});
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

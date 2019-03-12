var express = require('express');
var qs = require('querystring');
var db = require('../../models');
var generateThumbnail = require('../../messages/thumbnails').generateThumbnail;
var previewThumbnails = require('../../messages/thumbnails').previewThumbnails;
var router = express.Router();

// default redirect to random
router.get('/list', function(req, res) {
  res.redirect(`${req.baseUrl}/list/random?${qs.stringify(req.query)}`);
});

router.get('/list/:sort', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  if (sort === 'recommended') {
    db.videos
      .getRecommendedVideos(req.user, limit, offset)
      .then(function(videos) {
        res.json(videos);
      })
      .catch(function(err) {
        console.error(err);
        res.status(500).json({
          error: "Couldn't fetch videos",
        });
      });
  } else {
    db.videos
      .getVideos(req.user, limit, offset, sort)
      .then(function(videos) {
        res.json(videos);
      })
      .catch(function(err) {
        console.error(err);
        res.status(500).json({
          error: "Couldn't fetch videos",
        });
      });
  }
});

router.get('/related/:videoId', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  db.videos
    .getRelatedVideos(req.user, limit, offset, req.params.videoId)
    .then(function(videos) {
      res.json(videos);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: "Couldn't fetch videos",
      });
    });
});

router.get('/managed', function(req, res) {
  db.videos
    .getManagedVideos(req.user)
    .then(function(videos) {
      return res.json(videos);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: "Couldn't fetch videos",
      });
    });
});

router.get('/video/:id/permissions', function(req, res) {
  db.videoAcls
    .getvideoAcls(req.user, req.params.id)
    .then(function(data) {
      return res.json(data);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to get channel videos',
      });
    });
});

router.get('/search', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var query = req.query.query;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  db.knexnest(
    db.videos
      .search(req.user, query)
      .limit(limit)
      .offset(offset)
      .modify(db.videos.order, 'relevance')
      .modify(db.videos.order, 'new'),
  )
    .then(function(videos) {
      res.json(videos);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: "Couldn't fetch videos",
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
  db.videos
    .initialCreate(req.user, {
      creator: req.user && req.user.id,
      channel: req.body.channel,
      name: req.body.name,
    })
    .then(function(video) {
      res.json(video.id);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Video creation failed',
      });
    });
});

router.get('/video/:id', function(req, res) {
  db.videos
    .getVideo(req.user, req.params.id)
    .then(function(video) {
      if (video) {
        return res.json(video);
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: "Couldn't get video",
      });
    });
});

router.get('/video/:id/playlists', function(req, res) {
  db.videos
    .getVideoPlaylists(req.user, req.params.id)
    .then(function(playlists) {
      if (playlists) {
        return res.json(playlists);
      }
      return res.status(404).json({
        error: 'No playlists for this video',
      });
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: "Couldn't get playlists for this video",
      });
    });
});

router.put('/video/:id/view', function(req, res) {
  db.videos
    .viewVideo(req.user, req.params.id)
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
  db.videos
    .likeVideo(req.user, req.params.id)
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
  db.videos
    .dislikeVideo(req.user, req.params.id)
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

router.put('/tags/:action', function(req, res) {
  db.videos
    .editTags(req.user, req.params.action, req.body)
    .then(function(result) {
      if (!!result) {
        return res.sendStatus(200);
      }
      return res.status(404).json({
        error: 'No such videos',
      });
    })
    .catch(function(err) {
      var statusCode = err.code || 500;
      res.status(statusCode).json({
        error: err.message || 'Videos edit failed',
      });
    });
});

router.put('/property/:property', function(req, res) {
  db.videos
    .editProperty(req.user, req.params.property, req.body)
    .then(function(result) {
      if (!!result) {
        return res.sendStatus(200);
      }
      return res.status(404).json({
        error: 'No such videos',
      });
    })
    .catch(function(err) {
      var statusCode = err.code || 500;
      res.status(statusCode).json({
        error: err.message || 'Videos edit failed',
      });
    });
});

router.put('/video/:id/permissions', function(req, res) {
  db.videos
    .editPrivacy(req.user, req.params.id, req.body)
    .then(function(result) {
      if (!!result) {
        return res.sendStatus(200);
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function(err) {
      res.status(err.code).json({
        error: err.message || 'Video edit failed',
      });
    });
});

router.put('/permissions', function(req, res) {
  db.videos
    .editVideosPrivacy(req.user, req.body)
    .then(function(result) {
      if (!!result) {
        return res.sendStatus(200);
      }
      return res.status(404);
    })
    .catch(function(err) {
      res.status(err.code).json({
        error: err.message || 'Video edit failed',
      });
    });
});

router.put('/video/:id', function(req, res) {
  var video = req.body;
  db.videos
    .edit(req.user, req.params.id, video)
    .then(function(result) {
      if (!!result) {
        if (video.thumbnail !== undefined) {
          generateThumbnail(req.params.id, `${(video.thumbnail + 1) * 20}%`);
        }
        return res.sendStatus(200);
      }
      return res.status(404).json({
        error: 'No such video',
      });
    })
    .catch(function(err) {
      console.error(err);
      res.status(err.code || 500).json({
        error: err.message || 'Video edit failed',
      });
    });
});

router.delete('/:id', function(req, res) {
  db.videos
    .delete(req.user, req.params.id)
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
  db.comments
    .getComments(req.user, req.params.videoId, { page, before })
    .then(function(comments) {
      res.json(comments);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.post('/:videoId/comments', function(req, res, next) {
  db.comments
    .postComment(req.user, req.params.videoId, req.body.comment)
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.get('/:videoId/thumbnails', function(req, res, next) {
  db.videos
    .checkAuth(req.params.videoId, req.user)
    .then(function({ count }) {
      return Promise.resolve(count > 0);
    })
    .then(function(authorized) {
      if (!authorized) {
        return res.sendStatus(403);
      }
      var count = +req.query.count || 1;
      if (isNaN(count)) {
        res.status(400).send('count must be a number');
      }
      if (count > 16 || count < 1) {
        res.status(400).send('count must be between 1 and 16');
      }
      previewThumbnails(req.params.videoId, count)
        .then(function(thumbs) {
          if (count !== thumbs.length) {
            return next(new Error('Encountered a problem getting video thumbnails'));
          }
          if (count === 1) {
            var thumb = Buffer.from(thumbs[0].replace(/^data:image\/png;base64,/, ''), 'base64');
            res.writeHead(200, {
              'Content-Type': 'image/png',
              'Content-Length': thumb.length,
            });
            return res.end(thumb);
          }
          res.json(thumbs);
        })
        .catch(function(err) {
          next(err);
        });
    });
});

router.get('/managed/:videoId', function(req, res, next) {
  db.videos
    .getManagedVideos(req.user, req.params.videoId)
    .then(function(video) {
      res.json(video);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.get('/managed', function(req, res, next) {
  db.videos
    .getManagedVideos(req.user, req.params.videoId)
    .then(function(video) {
      res.json(video);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

module.exports = router;

var os = require('os');
var fs = require('fs');
var qs = require('querystring');
var path = require('path');
var express = require('express');
var multer = require('multer');
var db = require('../../models');
var router = express.Router();

var OSClient = require('vod-object-storage-client').S3Client();

var channelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    var dest = path.join(os.tmpdir(), req.params.id);
    fs.access(dest, function(err) {
      if (err) {
        fs.mkdir(dest, function(error) {
          cb(error, dest);
        });
      }
      else {
        cb(null, dest);
      }
    });
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}.png`);
  }
});
var upload = multer({ storage: channelStorage });

router.get('/managed', function(req, res) {
  db.channels.getManagedChannels(req.user)
    .then(function(results) {
      return res.json(results);
    })
    .catch(function(err){
      console.error(err);
      return res.status(500).json({
        error: 'Failed to get managed channels',
      });
    });
});

router.get('/search', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var query = req.query.query;
  limit = Math.min(limit, 60);

  db.knexnest(
    db.channels.search(req.user, query)
    .limit(limit)
    .offset(offset)
    .modify(db.channels.order, 'relevance')
    .modify(db.channels.order, 'new'),
    true,
  ).then(function(videos) {
    res.json(videos);
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({
      error: 'Couldn\'t fetch videos',
    });
  });
});

router.get('/:id', function(req, res) {
  db.channels.getChannel(req.user, req.params.id)
    .then(function(channel) {
      if (channel) {
        return res.json(channel);
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

router.put('/:id/follow', function(req, res) {
  db.channels.followChannel(req.user, req.params.id)
    .then(function() {
      res.json({});
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Coldn\'t follow channel',
      });
    })
});

router.put('/:id/unfollow', function(req, res) {
  db.channels.unfollowChannel(req.user, req.params.id)
    .then(function() {
      res.json({});
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Coldn\'t unfollow channel',
      });
    });
});

router.get('/:id/followers', function(req, res) {
  db.channels.getFollowers(req.user, req.params.id)
    .then(function(followers) {
      if (!followers) {
        return res.sendStatus(404);
      }
      return res.json(followers);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Coldn\'t get followers',
      });
    });
});

router.get('/:id/following', function(req, res) {
  db.channels.getFollowings(req.user, req.params.id)
    .then(function(followings) {
      if (!followings) {
        return res.sendStatus(404);
      }
      return res.json(followings);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Coldn\'t get followings',
      });
    });
});

router.put('/:id', function(req, res) {
  db.channels.editChannel(req.user, req.params.id, req.body)
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

router.post('/images/:id', channelImagesUpload, function(req, res) {
  // TO DO check auth
  var promises = [];
  if (req.files.profile) {
    promises.push(OSClient.uploadChannelImage(req.params.id, 'profile', req.files.profile[0].path));
  }
  if (req.files.cover) {
    promises.push(OSClient.uploadChannelImage(req.params.id, 'cover', req.files.cover[0].path));
  }
  Promise.all(promises)
    .then(function() {
      res.json({});
    })
    .catch(function(err) {
      db.channels.deleteChannelAdmin(req.params.id);
      console.error(err);
      res.status(500).json({
        error: 'Failed to upload channel images',
      });
    });
});

router.post('/', channelImagesUpload, function(req, res) {
  db.channels.createChannel(req.body)
    .then(function(result) {
      return res.json(result);
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
  res.redirect(`${req.baseUrl}/${req.params.id}/videos/new?${qs.stringify(req.query)}`);
});

router.get('/:id/videos/:sort', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  db.channels.getChannelVideos(req.user, req.params.id, limit, offset, sort)
    .then(function(result) {
      return res.json(result);
    })
    .catch(function (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to get channel videos',
      });
    });
});

module.exports = router;

var os = require('os');
var fs = require('fs');
var qs = require('querystring');
var path = require('path');
var express = require('express');
var multer = require('multer');
var Channel = require('../../models').Channel;
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
  Channel.getManagedChannels(req.params.id)
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

router.get('/:id', function(req, res) {
  Channel.getChannel(req.params.id)
    .then(function([channel, isFollowing]) {
      if (channel) {
        var resChannel = channel.get({ plain: true });
        resChannel.isFollowing = isFollowing;
        return res.json(resChannel);
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
  Channel.followChannel(req.params.id)
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
  Channel.unfollowChannel(req.params.id)
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
  Channel.getFollowers(req.params.id)
    .then(function(followers) {
      if (!followers) {
        return res.sendStatus(404);
      }
      return res.json(followers.map(function(follower) {
        var res = follower.get({ plain: true });
        delete res.ChannelFollowers;
        return res;
      }));
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Coldn\'t get followers',
      });
    });
});

router.get('/:id/following', function(req, res) {
  Channel.getFollowings(req.params.id)
    .then(function(followings) {
      if (!followings) {
        return res.sendStatus(404);
      }
      return res.json(followings.map(function(following) {
        var res = following.get({ plain: true });
        delete res.ChannelFollowers;
        return res;
      }));
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Coldn\'t get followings',
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
      Channel.deleteChannel(req.params.id);
      console.error(err);
      res.status(500).json({
        error: 'Failed to upload channel images',
      });
    });
});

router.post('/', channelImagesUpload, function(req, res) {
  Channel.createChannel(req.body)
    .then(function(result) {
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
  res.redirect(`${req.baseUrl}/${req.params.id}/videos/new?${qs.stringify(req.query)}`);
});

router.get('/:id/videos/:sort', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  Channel.getChannelVideos(req.params.id, limit, offset, sort)
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

var express = require('express');
var Channel = require('../../models').Channel;
var router = express.Router();

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

router.post('/', function(req, res) {
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

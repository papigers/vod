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
  Channel.createChannel(req.body.params)
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

module.exports = router;

var express = require('express');
var router = express.Router();
var db = require('../../models');

router.get('/', function(req, res) {
    db.playlists
      .getPlaylists(req.user)
      .then(function(playlists) {
        if (playlists) {
          return res.json(playlists);
        }
        return res.status(404).json({
          error: 'No such playlist',
        });
      })
      .catch(function(err) {
        console.error(err);
        return res.status(500).json({
          error: "Couldn't get channel",
        });
      });
  });

router.get('/:id', function(req, res) {
  db.playlists
    .getPlaylist(req.user, req.params.id)
    .then(function(playlist) {
      if (playlist) {
        return res.json(playlist);
      }
      return res.status(404).json({
        error: 'No such playlist',
      });
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: "Couldn't get channel",
      });
    });
});

router.post('/', function(req, res) {
    db.playlists
      .getPlaylist(req.user, req.body.playlist)
      .then(function(result) {
          return res.json(result);
      })
      .catch(function(err) {
        console.error(err);
        return res.status(500).json({
          error: 'Failed to create playlist',
        });
      });
  });
  
router.put('/:id', function(req, res) {
  db.playlists
    .updatePlaylist(req.user, req.params.id, req.body.playlist)
    .then(function(result) {
      return res.json(result);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
          error: 'Failed to update playlist',
      });
    });
});

module.exports = router;

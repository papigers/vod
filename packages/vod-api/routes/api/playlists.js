var express = require('express');
var router = express.Router();
var db = require('../../models');

router.get('/managed', function(req, res) {
    db.playlists
      .getManagedPlaylists(req.user)
      .then(function(playlists) {
        if (playlists && playlists.length) {
          return res.json(playlists);
        }
        return res.status(404).json({
          error: 'There are no playlists',
        });
      })
      .catch(function(err) {
        console.error(err);
        return res.status(500).json({
          error: "Couldn't get playlists",
        });
      });
  });

router.get('/:id', function(req, res) {
  db.playlists
    .getPlaylist(req.user, req.params.id)
    .then(function(playlist) {
      if (playlist && playlist.length === 1) {
        return res.json(playlist[0]);
      }
      return res.status(404).json({
        error: "There's no such playlist",
      });
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: "Couldn't get playlist",
      });
    });
});

router.post('/', function(req, res) {
    db.playlists
      .createPlaylist(req.user, req.body)
      .then(function(result) {
        if (result && result.id) {
          return res.status(200).json({
            playlistId: result.id,
          });
        }
        return res.sendStatus(404);
      })
      .catch(function(err) {
        console.error(err);
        return res.status(500).json({
          error: 'Failed to create playlist',
        });
      });
  });

  router.put('/:id/:videoId', function(req, res) {
    db.playlists
      .addVideoToPlaylist(req.user, req.params.id, req.params.videoId)
      .then(function(result) {
        if (result) {
          return res.sendStatus(200);
        }
        return res.sendStatus(404);
      })
      .catch(function(err) {
        console.error(err);
        return res.status(500).json({
            error: 'Failed to add video to playlist',
        });
      });
  });
  
router.put('/:id', function(req, res) {
  db.playlists
    .updatePlaylist(req.user, req.params.id, req.body)
    .then(function(result) {
      if (result) {
        return res.sendStatus(200);
      }
      return res.sendStatus(404);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
          error: 'Failed to update playlist',
      });
    });
});

router.delete('/:id', function(req, res) {
  db.videos
    .deletePlaylist(req.user, req.params.id)
    .then(function(deleted) {
      if (deleted) {
        return res.sendStatus(200);
      }
      return res.sendStatus(404);
    })
    .catch(function(err) {
      console.error(err);
      res.sendStatus(500);
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var db = require('../../models');

router.get('/managed', function(req, res) {
  db.playlists
    .getManagedPlaylists(req.user)
    .then(function(playlists) {
      if (playlists) {
        return res.json(playlists);
      }
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
    .then(function(playlists) {
      if (playlists && playlists[0]) {
        return res.json(playlists[0]);
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

router.get('/channel/:id', function(req, res) {
  db.playlists
    .getPlaylistsByChannel(req.user, req.params.id)
    .then(function(playlists) {
      if (playlists) {
        return res.json(playlists);
      }
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: "Couldn't get channel playlists",
      });
    });
});

router.post('/', function(req, res) {
  db.playlists
    .createPlaylist(req.user, req.body)
    .then(function(results) {
      if (results[0] && results[0].rowCount) {
        return res.sendStatus(201);
      }
      return res.sendStatus(401);
    })
    .catch(function(err) {
      return res.status(500).json({
        error: 'Failed to create new playlist',
      });
    });
});

router.put('/:id/add/:videoId', function(req, res) {
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

router.put('/:id/remove/:videoId', function(req, res) {
  db.playlists
    .removeVideoFromPlaylist(req.user, req.params.id, req.params.videoId)
    .then(function(result) {
      if (result) {
        return res.sendStatus(200);
      }
      return res.sendStatus(404);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to remove video from playlist',
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
  db.playlists
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

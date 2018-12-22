var express = require('express');
var router = express.Router();
var db = require('../../models');

router.get('/', function(req, res) {
  var limit = req.query.limit || 20;
  var offset = req.query.offset || 0;
  var query = req.query.query;
  limit = Math.min(limit, 60);

  db.knexnest(
    db.knex
      .union(
        function() {
          db.videos.searchVideos.call(this, req.user, query);
        },
        function() {
          db.channels.searchChannels.call(this, req.user, query);
        },
        true,
      )
      .offset(offset)
      .limit(limit)
      .orderBy('_rank', 'desc')
      .orderBy('_createdAt', 'desc'),
    true,
  )
    .then(function(results) {
      res.json(
        results.map(function(r) {
          delete r.rank;
          return r;
        }),
      );
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Search failed',
      });
    });
});

module.exports = router;

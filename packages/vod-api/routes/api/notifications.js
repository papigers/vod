var express = require('express');
var router = express.Router();
var db = require('../../models');

router.get('/', function(req, res, next) {
  db.notifications.getChannelNotifications(req.user)
  .then(function(results) {
    res.json(results);
  })
  .catch(function(err) {
    next(err);
  });
});

module.exports = router;

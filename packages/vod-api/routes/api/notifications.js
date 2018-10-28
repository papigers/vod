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

router.put('/read/:id', function(req, res, next) {
  db.notificationReceipts.readNotifications(req.user, [req.params.id])
  .then(function() {
    res.sendStatus(200);
  })
  .catch(function(err) {
    next(err);
  });
});

router.put('/read', function(req, res, next) {
  db.notificationReceipts.readNotifications(req.user, [req.body.notifications])
  .then(function() {
    res.sendStatus(200);
  })
  .catch(function(err) {
    next(err);
  });
});

module.exports = router;

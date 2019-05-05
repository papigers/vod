var express = require('express');
var db = require('../../models');
var router = express.Router();

router.get('/report', function(req, res, next) {
  return db.transactions
    .getBalanceReport(req.user)
    .then(function(result) {
      return res.json(result);
    })
    .catch(function(err) {
      console.log(err);
      next(err);
    });
});

router.post('/', function(req, res, next) {
  return db.transactions
    .loadCredit(req.body, req.user)
    .then(function(result) {
      return res.json(result);
    })
    .catch(function(err) {
      console.log(err);
      next(err);
    });
});

router.post('/subscription', function(req, res, next) {
  return db.transactions
    .buySubscription(req.body.channel, req.body.plan, req.user)
    .then(function() {
      return res.sendStatus(200);
    })
    .catch(function(err) {
      console.log(err);
      next(err);
    });
});

module.exports = router;

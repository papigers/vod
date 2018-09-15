var express = require('express');
var router = express.Router();
var Channel = require('../../models').Channel;

router.post('/user-login', function(req, res) {
  var id = req.body.id;

  Channel.userLogin(id);
});

module.exports = router;

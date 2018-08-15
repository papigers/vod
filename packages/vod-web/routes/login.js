var express = require('express');
var router = express.Router();
var passport = require('passport');
var metadata = require('../passport');

router.get('/', passport.authenticate('saml', { successReturnToOrRedirect: '/', failureRedirect: '/error', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  }
);

router.get('/metadata', function(req, res) {
  res.send(metadata).end();
});

router.post('/callback',
  passport.authenticate('saml', { successReturnToOrRedirect: '/', failureRedirect: '/error', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  }
);

module.exports = router;

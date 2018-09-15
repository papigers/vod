'use strict';
var passport = require('passport');
var jwt = require('jsonwebtoken');

var authMiddlewares = [
  passport.authenticate(['JWT', 'trusted-header'], { session: false }),
  function(req, res, next) {
    // don't override existing cookie
    if (!req.cookies.jwt) {
      var expiresIn = 60 * 60 * 24 * 180; // 180 days
      var token = jwt.sign(req.user, auth.jwt.secret, { expiresIn });
      res.cookie('jwt', token, { maxAge: 1000 * expiresIn, httpOnly: true });
    }
    next();
  },
];

module.exports = authMiddlewares;

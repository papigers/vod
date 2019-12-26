'use strict';
var passport = require('passport');
var jwt = require('jsonwebtoken');
require('./Jwt');
// require('./OAuth');

const PRODUCTION = process.env.NODE_ENV === 'production';

let authProviders = ['jwt'];
if (!PRODUCTION) {
  require('./KerberosHeader');
  authProviders = ['jwt', 'trusted-header'];
}

var authMiddlewares = [
  passport.authenticate(authProviders, { session: false }),
  function(req, res, next) {
    // don't override existing cookie
    if (!req.cookies.jwt) {
      var expiresIn = 60 * 60 * 24 * 180; // 180 days
      var opts = {};
      if (!req.user.exp) {
        opts.expiresIn = expiresIn;
      }
      var token = jwt.sign(req.user, 'cookie-secret', opts);
      res.cookie('jwt', token, { maxAge: 1000 * expiresIn, httpOnly: true });
    }
    next();
  },
];

module.exports = authMiddlewares;

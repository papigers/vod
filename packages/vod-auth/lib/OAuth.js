var passport = require('passport');
var ActiveDirectory = require('activedirectory');
var Strategy = require('passport-oauth2').Strategy;
var config = require('config');

// make sure to write lowercase headers.
passport.use(
  new Strategy(
    {
      authorizationURL: config.oidc.authorizationURL,
      tokenURL: config.oidc.tokenURL,
      clientID: config.oidc.clientID,
      clientSecret: config.oidc.clientSecret,
      callbackURL: config.oidc.callbackURL,
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb({
        id: profile.sub,
        name: profile.displayName,
        description: profile.title,
        groups: profile.groups,
      });
    },
  ),
);

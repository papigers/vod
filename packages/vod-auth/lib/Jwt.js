var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

// to make sure tokens from older versions won't cause bugs for new versions.
var requiredFields = [
  'id',
  'name',
  'description',
  'groups',
];

passport.use(new JwtStrategy({
  secretOrKey: 'cookie-secret',
  jwtFromRequest : ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    function cookieExtractor(req) {
      var token = null;
      if (req && req.cookies)
      {
          token = req.cookies['jwt'];
      }
      return token;
    },
  ]),
}, function(jwt, done) {
  var requiredExists = Object.keys(jwt).every(function(field) {
    return requiredFields.indexOf(field) !== -1;
  });
  // should maybe add second check that user exists
  done(null, requiredExists && jwt);
}));

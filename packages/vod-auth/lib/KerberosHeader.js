var passport = require('passport');
var ActiveDirectory = require('activedirectory');
var Strategy = require('passport-trusted-header').Strategy;
var axios = require('axios');
var config = require('config');

var ad = new ActiveDirectory({
  url: process.env.AD_DOMAIN_CONTROLLER_URL,
  baseDN: process.env.AD_BASE_DN,
  username: process.env.AD_PROJECTAL_USER,
  password: process.env.AD_PROJECTAL_USER_PASSWORD,
  scope: 'sub',
  attributes: {
    user: ['sAMAccountName', 'displayName', 'title', 'objectClass'], // TO DO: override to include full name, rank, etc...
    group: ['dn'],
  },
});

// make sure to write lowercase headers.
passport.use(
  new Strategy(
    {
      headers: ['remote_user'],
    },
    function(headers, done) {
      var channel = null;
      var id = headers.remote_user;
      console.log(id, headers)
      ad.findUser(id, function(err, user) {
        if (err || !user) {
          return done(err || 'User not found');
        }

        ad.getGroupMembershipForUser(id, function(err, groups) {
          if (err || !groups) {
            return done(err || 'User not found');
          }

          channel = {
            id,
            name: user.displayName,
            description: user.title,
          };

          axios
            .post(`${config.api}/private/user-login`, channel)
            .then(function() {
              channel.groups = groups.map(function(group) {
                return group.dn;
              });
              done(null, channel);
            })
            .catch(done);
        });
      });
    },
  ),
);

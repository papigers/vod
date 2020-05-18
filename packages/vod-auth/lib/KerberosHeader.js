var passport = require('passport');
var ActiveDirectory = require('activedirectory');
var Strategy = require('passport-trusted-header').Strategy;
var axios = require('axios');
var config = require('config');

var ad = new ActiveDirectory({
  url: 'ldap://vod-dc.westeurope.cloudapp.azure.com',
  baseDN: 'ou=orgs,dc=example,dc=com',
  username: 'vod@example.com',
  password: 'Aa123123',
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

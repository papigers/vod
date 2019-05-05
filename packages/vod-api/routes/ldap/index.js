var express = require('express');
var ActiveDirectory = require('activedirectory');
var config = require('config');
var ad = new ActiveDirectory(config.ad);

var router = express.Router();

function adFilter(filter, objectClass) {
  var ldapFilter = !!objectClass
    ? `(&(objectClass=${objectClass})(|(distinguishedName=${filter})(anr=${filter})))`
    : `(|(distinguishedName=${filter})(anr=${filter}))`;
  return new Promise(function(resolve, reject) {
    ad.find(ldapFilter, function(err, res) {
      if (err) {
        console.error(err);
        reject(err);
      }
      if (!res) {
        return resolve([]);
      }
      var allResults = res.users || [];
      var allResults = allResults.concat(res.groups || []);
      return resolve(allResults);
    });
  });
}

function getGroupMembers(group) {
  return new Promise(function(resolve, reject) {
    ad.getUsersForGroup(group, function(err, users) {
      if (err) {
        console.error(err);
        reject(err);
      }
      if (!users) {
        reject(`Group ${group} not found`);
      }
      resolve(users);
    });
  });
}

function getUserKabams(user) {
  return new Promise(function(resolve, reject) {
    ad.findUser(user && user.id, function(err, user) {
      if (!!err) {
        return reject(err);
      }
      if (!user) {
        return reject(new Error('User not found'));
      }
      var ous = dn.match(/cn=.+,ou=Users,ou=ouU-(?<bot>.{4,}),ou=ouU-(?<top>.{4,})/i).groups;
      ad.getUsersForGroups(`ggd-${ous.top}-${ous.bot}-Kabam`, function(err, users) {
        if (!!err) {
          return reject(err);
        }
        return resolve(users || []);
      });
    });
  });
}

function getOrgUsers(org) {
  return new Promise(function(resolve, reject) {
    ad.findUsers({ baseDN: org, scope: 'sub' }, function(err, users) {
      if (err) {
        return reject(err);
      }
      resolve(users);
    });
  });
}

router.post('/search', function(req, res) {
  adFilter(req.body.filter)
    .then(function(results) {
      return res.json({
        results: results,
      });
    })
    .catch(function(error) {
      console.error(error);
      return res.sendStatus(500);
    });
});

router.post('/search/:type', function(req, res) {
  adFilter(req.body.filter, req.params.type)
    .then(function(results) {
      return res.json({
        results: results,
      });
    })
    .catch(function(error) {
      console.error(error);
      return res.sendStatus(500);
    });
});

module.exports = router;
module.exports.adFilter = adFilter;
module.exports.getGroupMembers = getGroupMembers;
module.exports.getOrgUsers = getOrgUsers;
module.exports.getUserKabams = getUserKabams;

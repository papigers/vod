var express = require('express');
var ActiveDirectory = require('activedirectory');
var config = require('config');
var ad = new ActiveDirectory(config.ad);

var router = express.Router();

function adFilter(filter, objectClass) {
  var ldapFilter = !!objectClass ? `(&(objectClass=${objectClass})(anr=${filter}))` : `(anr=${filter})`;
  return new Promise(function (resolve, reject) {
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
  })
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

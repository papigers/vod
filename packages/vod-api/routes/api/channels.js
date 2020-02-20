var os = require('os');
var fs = require('fs');
var qs = require('querystring');
var path = require('path');
var express = require('express');
var multer = require('multer');
var sharp = require('sharp');
var config = require('config');
var db = require('../../models');
var ldap = require('../ldap');
var router = express.Router();

var OSClient = require('@vod/vod-object-storage-client').S3Client();

var channelStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    var dest = path.join('/app/entrypoint', req.params.id);
    fs.stat(dest, function(err) {
      if (err == null) {
        return cb(null, dest);
      } else if (err.code === 'ENOENT') {
        fs.mkdir(dest, function(error) {
          if (error && error.code !== 'EEXIST') {
            return cb(error, dest);
          }
          cb(null, dest);
        });
      } else {
        cb(err, dest);
      }
    });
  },
  filename: function(req, file, cb) {
    cb(null, `${file.fieldname}.png`);
  },
});
var upload = multer({
  storage: channelStorage,
  limits: {
    fieldSize: 10 * 1024 * 1024,
  },
});

router.get('/managed', function(req, res) {
  db.channels
    .getManagedChannels(req.user)
    .then(function(results) {
      return res.json(results);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to get managed channels',
      });
    });
});

router.get('/search', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var query = req.query.query;
  limit = Math.min(limit, 60);

  db.knexnest(
    db.channels
      .search(req.user, query)
      .limit(limit)
      .offset(offset)
      .modify(db.channels.order, 'relevance')
      .modify(db.channels.order, 'new'),
    true,
  )
    .then(function(videos) {
      res.json(videos);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: "Couldn't fetch videos",
      });
    });
});

router.get('/plans', function(req, res, next) {
  db.subscriptions
    .getGlobalSubscription()
    .then(function(subs) {
      return res.json(subs);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
  // Promise.all(
  //   config.plans
  //     .filter(function(plan) {
  //       return plan.id !== 'personal';
  //     })
  //     .map(function(plan) {
  //       return db.subscriptions.getGlobalSubscription(plan.id).then(function(sub) {
  //         return Promise.resolve({
  //           ...plan,
  //           subscription: sub && sub.id,
  //         });
  //       });
  //     }),
  // )
  //   .then(function(result) {
  //     return res.json(
  //       result.sort(function(p1, p2) {
  //         return p1.price - p2.price;
  //       }),
  //     );
  //   })
  //   .catch(function(err) {
  //     console.error(err);
  //     next(err);
  //   });
});

router.get('/balance', function(req, res) {
  res.redirect(`${req.user && req.user.id}/balance`);
});

router.get('/balance-unverified', function(req, res) {
  res.redirect(`${req.user && req.user.id}/balance-unverified`);
});

router.get('/:id', function(req, res) {
  db.channels
    .getChannel(req.user, req.params.id)
    .then(function(channel) {
      if (channel) {
        return res.json(channel);
      }
      return res.status(404).json({
        error: 'No such channel',
      });
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: "Couldn't get channel",
      });
    });
});

router.put('/:id/follow', function(req, res) {
  db.channels
    .followChannel(req.user, req.params.id)
    .then(function() {
      res.json({});
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: "Coldn't follow channel",
      });
    });
});

router.put('/:id/unfollow', function(req, res) {
  db.channels
    .unfollowChannel(req.user, req.params.id)
    .then(function() {
      res.json({});
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: "Coldn't unfollow channel",
      });
    });
});

router.get('/:id/followers', function(req, res) {
  db.channels
    .getFollowers(req.user, req.params.id)
    .then(function(followers) {
      if (!followers) {
        return res.sendStatus(404);
      }
      return res.json(followers);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: "Coldn't get followers",
      });
    });
});

router.get('/:id/following', function(req, res) {
  db.channels
    .getFollowings(req.user, req.params.id)
    .then(function(followings) {
      if (!followings) {
        return res.sendStatus(404);
      }
      return res.json(followings);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: "Coldn't get followings",
      });
    });
});

router.put('/:id', function(req, res) {
  db.channels
    .editChannel(req.user, req.params.id, req.body.channel)
    .then(function(result) {
      if (!!result) {
        return res.json({});
      }
      return res.status(404).json({
        error: 'No such channel',
      });
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).json({
        error: 'Channel edit failed',
      });
    });
});

var channelImagesUpload = upload.fields([
  {
    name: 'profile',
    maxCount: 1,
  },
  {
    name: 'cover',
    maxCount: 1,
  },
]);

router.post('/images/:id', channelImagesUpload, function(req, res) {
  db.channels
    .checkAuthManage(req.params.id, req.user)
    .then(function({ count }) {
      if (count == 0) {
        return res.sendStatus(403);
      }
      var promises = [];
      if (req.files.profile) {
        promises.push(
          sharp(req.files.profile[0].path)
            .resize(100)
            .toBuffer()
            .then(function(buffer) {
              return new Promise(function(resolve, reject) {
                fs.writeFile(req.files.profile[0].path, buffer, function(e) {
                  if (e) {
                    return reject(e);
                  }
                  resolve();
                });
              });
            })
            .then(function() {
              return OSClient.uploadChannelImage(
                req.params.id,
                'profile',
                req.files.profile[0].path,
              );
            }),
        );
      }
      if (req.files.cover) {
        promises.push(
          sharp(req.files.cover[0].path)
            .resize(1280)
            .toBuffer()
            .then(function(buffer) {
              return new Promise(function(resolve, reject) {
                fs.writeFile(req.files.cover[0].path, buffer, function(e) {
                  if (e) {
                    return reject(e);
                  }
                  resolve();
                });
              });
            })
            .then(function() {
              return OSClient.uploadChannelImage(req.params.id, 'cover', req.files.cover[0].path);
            }),
        );
      }
      return Promise.all(promises);
    })
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      // Check Form type
      if (req.body.formType === 'create') {
        db.channels.deleteChannelAdmin(req.params.id).then();
      }
      console.error(err);
      res.status(500).json({
        error: 'Failed to upload channel images',
      });
    });
});

router.post('/', channelImagesUpload, function(req, res) {
  // TODO: check if user has kabams
  // ldap
  //   .getUserKabams(req.user)
  Promise.resolve(['TODO'])
    .then(function(kabams) {
      if (!kabams.length) {
        return res.status(412).json({
          error: 'לא מוגדר קב"ם ליחידתך',
        });
      }
      return db.channels.createChannel(req.body, req.user).then(function(result) {
        return res.json(result);
      });
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'עלתה שגיאה ביצירת הערוץ',
      });
    });
});

// default redirect to new uploads
router.get('/:id/videos', function(req, res) {
  res.redirect(`${req.baseUrl}/${req.params.id}/videos/new?${qs.stringify(req.query)}`);
});

router.get('/:id/videos/:sort', function(req, res) {
  var limit = req.query.limit || 12;
  var offset = req.query.offset || 0;
  var fields = req.query.field;
  fields = fields && !Array.isArray(fields) ? [fields] : fields;
  var sort = req.params && req.params.sort;
  limit = Math.min(limit, 60); // minimum 60 videos = 5 pages per fetch.

  db.channels
    .getChannelVideos(req.user, req.params.id, limit, offset, sort, fields)
    .then(function(result) {
      return res.json(result);
    })
    .catch(function(err) {
      console.error(err);
      return res.status(500).json({
        error: 'Failed to get channel videos',
      });
    });
});

router.get('/:channelId/subscription', function(req, res, next) {
  db.channels
    .getChannelSubscriptions(req.params.channelId, req.user)
    .then(function(subscriptions) {
      res.json(subscriptions[0]);
    })
    .catch(function(error) {
      console.log(error);
      next(error);
    });
});

router.get('/:channelId/permissions', function(req, res) {
  db.channelAcls
    .getChannelAcls(req.params.channelId, req.user)
    .then(function(permissions) {
      var viewACL = [];
      var manageACL = [];
      permissions.forEach(function(perm) {
        switch (perm.access) {
          case 'VIEW':
            viewACL.push(perm);
            break;
          case 'MANAGE':
            manageACL.push(perm);
            break;
        }
      });
      res.json({
        viewACL,
        manageACL,
      });
    })
    .catch(function(err) {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/:id/balance', function(req, res, next) {
  db.transactions
    .getChannelBalance(req.params.id, req.user)
    .then(function(balance) {
      res.json(balance);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.get('/:id/balance-unverified', function(req, res, next) {
  db.transactions
    .getChannelBalanceUnverified(req.params.id, req.user)
    .then(function(balance) {
      res.json(balance);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

module.exports = router;

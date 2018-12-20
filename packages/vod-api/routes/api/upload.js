var express = require('express');
var multer = require('multer');
var path = require('path');
var os = require('os');
var fs = require('fs');
var tus = require('tus-node-server');

var enqueueEncoding = require('../../messages/encode');
var generateThumbnail = require('../../messages/thumbnails').generateThumbnail;
var db = require('../../models');
var router = express.Router();

function translateMetadata(metadata) {
  return metadata.split(',').reduce(function(metadatObj, keyValue) {
    const keyValueSplit = keyValue.split(' ');
    metadatObj[keyValueSplit[0]] = Buffer.from(keyValueSplit[1], 'base64').toString();
    return metadatObj;
  }, {}); 
}

var tusServer = new tus.Server();
tusServer.datastore = new tus.FileStore({
  path: path.join(os.tmpdir(), 'uploads'),
  relativeLocation: true,
  namingFunction: function(req, res) {
    return res.locals.videoId;
  }
});
tusServer.on(tus.EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
  const videoId = event.file.id;
  const file = path.join(os.tmpdir(), 'uploads', event.file.id);
  enqueueEncoding(videoId, file);
  generateThumbnail(videoId, '20%');
});
router.post('/video', function(req, res, next) {
  const metadata = translateMetadata(req.header('upload-metadata'));
  db.videos.initialCreate(req.user, {
    creator: req.user && req.user.id,
    channel: req.user && req.user.id,
    name: metadata.name.replace(/\.[^/.]+$/, ''),
  })
  .then(function(video) {
    res.locals.videoId = video.id;
    next();
  })
  .catch(function(err) {
    next(err);
  });
});
router.use('/video', tusServer.handle.bind(tusServer));

// router.post('/', videoUpload, function(req, res) {
//   db.videos.initialCreate(req.user, {
//     creator: req.user && req.user.id,
//     channel: req.body.channel,
//     name: req.body.name,
//   }).then(function(video) {
//     return enqueueEncoding(video.id, req.file.path).then(function() {
//       res.json(video.id);
//     });
//   }).catch(function(err) {
//     console.error(err);
//     res.status(500).json({
//       error: 'Video upload failed',
//     });
//   });
// });

module.exports = router;

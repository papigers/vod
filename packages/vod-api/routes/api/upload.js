var express = require('express');
var multer = require('multer');
var path = require('path');
var os = require('os');
var fs = require('fs');
var tus = require('tus-node-server');

var enqueueEncoding = require('../../messages/encode');
var db = require('../../models');
var router = express.Router();

// var channelStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     var dest = path.join(os.tmpdir(), 'uploads');
//     fs.access(dest, function(err) {
//       if (err) {
//         fs.mkdir(dest, function(error) {
//           cb(error, dest);
//         });
//       }
//       else {
//         cb(null, dest);
//       }
//     });
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${req.user && req.user.id}_${file.originalname}`);
//   }
// });
// var upload = multer({ storage: channelStorage });
// var videoUpload = upload.single('video');

var tusServer = new tus.Server();
tusServer.datastore = new tus.FileStore({
  path: path.join(os.tmpdir(), 'uploads'),
  relativeLocation: true,
});
tusServer.on(tus.EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
  console.log(`Upload complete for file ${event.file.id}`, Date.now());
  console.log(event);
});
router.use('/video', function(req, res, next) {
  console.log(req.baseUrl, req.originalUrl, req.url);
  next();
})
router.use('/video', tusServer.handle.bind(tusServer));
router.post('/video', function(req, res) {
  console.log('finished', Date.now());
})

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

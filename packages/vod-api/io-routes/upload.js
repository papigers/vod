var subscribeProgress = require('../messages/progress').subscribeProgress;
var unsubscribeProgress = require('../messages/progress').unsubscribeProgress;

function ioUpload(io) {
  io.of('/upload').on('connection', function (socket) {
    var subscriptions = [];
    subscribeProgress(socket.handshake.query.id, function(progress) {
      progress.id = socket.handshake.query.id;
      socket.emit('progress', progress);
    }).then(function(sub) {
      sub.type = 'progress';
      subscriptions.push(sub);
    }).catch(function(err) {
      console.error(e);
    });

    socket.on('disconnect', function() {
      subscriptions.filter(function(sub) {
        if (sub.type === 'progress') {
          unsubscribeProgress(sub);
          return false;
        }
        return true;
      })
    })
  });
}

module.exports = ioUpload;

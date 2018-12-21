var io = require('socket.io')();
var cookie = require('cookie');
var jwt = require('jsonwebtoken');

io.of('/upload').use(function(socket, next) {
  if (socket.request.headers.cookie) {
    var jwtCookie = cookie.parse(socket.request.headers.cookie).jwt;
    jwt.verify(jwtCookie, 'cookie-secret', function(err, decoded) {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = decoded;
      socket.token = jwtCookie;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
});
require('./io-routes/upload')(io);

module.exports = io;

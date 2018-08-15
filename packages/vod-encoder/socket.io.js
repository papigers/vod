var io = require('socket.io')();
require('./ioRoutes/upload')(io);

module.exports = io;

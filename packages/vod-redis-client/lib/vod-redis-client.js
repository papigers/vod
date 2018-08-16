'use strict';
var promisify = require('util').promisify;
var redis = require('redis');

module.exports = createRedisClient;

function createRedisClient(options) {
  var cacheEngine = redis.createClient(options);
  cacheEngine.on('connect', function() {
    console.log(`Cache server ${options.host} connected`);
  });
  cacheEngine.on('failure', function(details) {
    console.error(`Cache server ${details.server} went down due to: ${details.messages.join('')}`);
  });
  cacheEngine.on('reconnecting', function(details) {
    console.error(`Total downtime caused by cache server ${details.server}:${details.totalDownTime}ms`);
  });
  cacheEngine.getAsync = promisify(cacheEngine.get).bind(cacheEngine);
  cacheEngine.setAsync = promisify(cacheEngine.set).bind(cacheEngine);
  return cacheEngine;
}

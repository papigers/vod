var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");
var config = require('config');
var debug = require('debug')('vod:db');

var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, config.db.config, { operatorsAliases: false });
var db = {};

sequelize
  .authenticate()
  .catch(err => {
    console.error('Database connection failed:', err);
    throw err;
  });

// caching layer
var cacher;
if (config.cache.host) {
  debug('Initializing cache layer using memcached...');
  var redis = require('redis');
  var cacher = require('sequelize-redis-cache');
  var cacheEngine = redis.createClient({
    port: config.cache.port,
    host: config.cache.host,
    password: config.cache.password,
  });
  cacheEngine.on('ready', function(details) {
    console.log(`Server ${details.server} connected`);
  });
  cacheEngine.on('failure', function(details) {
    console.error(`Server ${details.server} went down due to: ${details.messages.join('')}`);
  });
  cacheEngine.on('reconnecting', function(details) {
    console.error(`Total downtime caused by server ${details.server}:${details.totalDownTime}ms`);
  });
}


// Export all models in the current directory
debug('Exporting models...');

try {
  fs.readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
      var model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
    });

  Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
      db[modelName].associate(db);
    }
  });

  // attach cache wrapper
  if (config.cache.host) {
    Object.keys(db).forEach(function(modelName){
      debug('Cached Model:', modelName);
      db[modelName] = cacher(sequelize, cacheEngine).model(modelName).ttl(config.cache.ttl);
    });
  }

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
}
catch(e) {
  console.log('Database connector initialization failed...');
  console.error(e);
}

module.exports = db;

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

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
}
catch(e) {
  console.log('Database connector initialization failed...');
  console.error(e);
}

module.exports = db;

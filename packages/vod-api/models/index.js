var fs = require("fs");
var path = require("path");
var debug = require('debug')('vod:db');
var knexfile = require('../knexfile');
var knex = require('knex')(knexfile);
var knexnest = require('knexnest');

var db = {};

knex.raw("SELECT 'test connection';").then(function(message) {
  debug('DB Connection successful');
}).catch(function(err) {
  debug('DB Connection failure');
  throw err;
});

// Export all models in the current directory
debug('Exporting models...');

try {
  var models = {};
  fs.readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
      var model = require(path.join(__dirname, file))(db);
      db[model.table] = model;
      models[model.table] = model;
    });

  db.models = models;
  db.knex = knex;
  db.knexnest = knexnest;
}
catch(e) {
  debug('Database connector initialization failed...');
  console.error(e);
}

module.exports = db;

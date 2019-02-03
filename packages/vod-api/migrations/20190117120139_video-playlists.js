var models = require('../models').models;
var createTable = require('../knexfile').createTable;
var dropTable = require('../knexfile').dropTable;
var tables = ['playlists', 'playlistVideos'];

exports.up = function(knex, Promise) {
  return tables.reduce((promise, table) => {
    return promise.then(() => createTable(knex, models[table], table));
  }, Promise.resolve());
};

exports.down = function(knex, Promise) {
  return tables.reverse().reduce((promise, table) => {
    return promise.then(() => dropTable(knex, models[table], table));
  }, Promise.resolve());
};

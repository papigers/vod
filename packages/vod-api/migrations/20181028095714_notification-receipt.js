var createTable = require('../knexfile').createTable;
var dropTable = require('../knexfile').dropTable;
var table = 'notificationReceipts';
var models = require('../models').models;

exports.up = async function(knex) {
  return knex.schema
    .table('notifications', function(table) {
      table.dropColumn('unread');
    })
    .then(function() {
      return createTable(knex, models[table], table);
    });
};

exports.down = async function(knex) {
  return dropTable(knex, models[table], table).then(function() {
    return knex.schema.table('notifications', function(table) {
      table.boolean('unread').defaultTo(true);
    });
  });
};

var tableName = 'videos';
var models = require('../models').models;
var createTable = require('../knexfile').createTable;
var dropTable = require('../knexfile').dropTable;

exports.up = async function(knex) {
  return knex.schema
    .table(tableName, function(table) {
      table.integer('metadata_height');
      table.integer('metadata_width');
      table.integer('metadata_resolution');
      table.float('metadata_duration', 10, 3);
      table.bigInteger('metadata_size');
      table
        .enu('state', ['DRAFT', 'PUBLISHED', 'UNLISTED'], {
          useNative: true,
          enumName: 'enum_videos_state',
        })
        .defaultTo('DRAFT');
    })
    .then(function() {
      return knex(tableName)
        .update('state', 'PUBLISHED')
        .where('published', true);
    })
    .then(function() {
      return knex(tableName)
        .update('state', 'DRAFT')
        .where('published', false);
    })
    .then(function() {
      return knex.schema.table(tableName, function(table) {
        table.dropColumn('published');
      });
    })
    .then(function() {
      return createTable(knex, models.uploads, 'uploads');
    })
    .then(function() {
      return knex.schema
        .raw(
          `
      CREATE OR REPLACE FUNCTION set_required_files_by_metadata()
      RETURNS trigger AS $$
      BEGIN
        UPDATE uploads SET required = (CASE
          WHEN NEW.metadata_resolution >= 1080 THEN 9
          WHEN NEW.metadata_resolution >= 720 THEN 8
          WHEN NEW.metadata_resolution >= 480 THEN 7
          WHEN NEW.metadata_resolution >= 360 THEN 6
          ELSE 5
        END) WHERE uploads.id = NEW.id;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `,
        )
        .raw(
          `
      CREATE TRIGGER ??
      AFTER UPDATE ON ??
      FOR EACH ROW
      WHEN (OLD.metadata_resolution IS DISTINCT FROM NEW.metadata_resolution)
      EXECUTE PROCEDURE set_required_files_by_metadata();
    `,
          ['metadata_required_upload_files_trigger', 'videos'],
        );
    });
};

exports.down = async function(knex) {
  return knex.schema
    .raw('drop trigger if exists ?? on ??', ['metadata_required_upload_files_trigger', 'videos'])
    .raw('drop function if exists set_required_files_by_metadata() cascade')
    .table(tableName, function(table) {
      table.boolean('published').defaultTo(false);
    })
    .then(function() {
      return knex(tableName)
        .update('published', true)
        .where('state', 'PUBLISHED');
    })
    .then(function() {
      return knex.schema
        .table(tableName, function(table) {
          table.dropColumns(
            'metadata_height',
            'metadata_width',
            'metadata_resolution',
            'metadata_duration',
            'metadata_size',
            'state',
          );
        })
        .raw('drop type if exists ??', ['enum_videos_state']);
    })
    .then(function() {
      return dropTable(knex, models.uploads, 'uploads');
    });
};

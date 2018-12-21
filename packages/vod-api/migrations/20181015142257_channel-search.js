exports.up = function(knex, Promise) {
  var schemaBuilder = knex.schema;
  return schemaBuilder
    .raw(
      `
    alter function videos_tsvector_update() rename to tsvector_update
  `,
    )
    .table('channels', function(table) {
      table.specificType('tsv', 'tsvector').index(null, 'gin');
    })
    .raw(
      `
    CREATE TRIGGER ??
    BEFORE INSERT OR UPDATE ON ??
    FOR EACH ROW
    EXECUTE PROCEDURE tsvector_update();
  `,
      ['channels_tsvector', 'channels'],
    )
    .then(function() {
      return knex('channels')
        .update(
          'tsv',
          knex.raw(
            `setweight(to_tsvector(?, coalesce(??, '')), ?) || setweight(to_tsvector(?, coalesce(??, '')), ?)`,
            [
              'pg_catalog.english',
              'channels.name',
              'A',
              'pg_catalog.english',
              'channels.description',
              'C',
            ],
          ),
        )
        .whereNull('tsv');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .raw('drop trigger if exists ?? on ??;', ['channels_tsvector', 'channels'])
    .table('channels', function(table) {
      table.dropColumn('tsv');
    })
    .raw('alter function tsvector_update() rename to videos_tsvector_update');
};

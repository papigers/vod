
exports.up = function(knex, Promise) {
  var schemaBuilder = knex.schema;
  return schemaBuilder.raw(`
    CREATE OR REPLACE FUNCTION videos_tsvector_update()
    RETURNS trigger AS $$
    BEGIN
      NEW.tsv = setweight(to_tsvector('pg_catalog.english', coalesce(new.name,'')), 'A') ||
                setweight(to_tsvector('pg_catalog.english', coalesce(new.description,'')), 'C');
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `).table('videos', function(table) {
    table.specificType('tsv', 'tsvector').index(null, 'gin');
  }).raw(`
    CREATE TRIGGER ??
    BEFORE INSERT OR UPDATE ON ??
    FOR EACH ROW
    EXECUTE PROCEDURE videos_tsvector_update();
  `, ['videos_tsvector', 'videos']).then(function() {
    return knex('videos').update(
      'tsv',
      knex.raw(
        `setweight(to_tsvector(?, coalesce(??, '')), ?) || setweight(to_tsvector(?, coalesce(??, '')), ?)`,
        ['pg_catalog.english', 'videos.name', 'A', 'pg_catalog.english', 'videos.description', 'C'],
      ),
    ).whereNull('tsv');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.raw('drop trigger if exists ?? on ??;', ['videos_tsvector', 'videos']).table('videos', function(table) {
    table.dropColumn('tsv');
  }).raw('drop function if exists videos_tsvector_update() cascade');
};

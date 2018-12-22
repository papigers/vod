var models = require('../models').models;

var tables = [
  'channels',
  'channelAcls',
  'channelFollowers',
  'videos',
  'videoAcls',
  'videoLikes',
  'videoViews',
  'comments',
  'tags',
];

exports.up = function(knex, Promise) {
  var schemaBuilder = knex.schema;
  return schemaBuilder
    .raw(
      `
    CREATE OR REPLACE FUNCTION on_update_timestamp()
    RETURNS trigger AS $$
    BEGIN
      NEW."updatedAt" = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `,
    )
    .then(function() {
      tables.forEach(function(table) {
        var model = models[table];
        schemaBuilder.createTable(table, function(t) {
          var attrs = model.attributes;
          var primary = [];
          Object.keys(attrs).forEach(function(name) {
            var attr = attrs[name];
            var type = attr.type;
            var builder = t;
            switch (type) {
              case 'char':
                builder = builder.specificType(name, `${type}(${attr.length})`);
                break;
              case 'string':
                builder = builder.string(name, attr.length);
                break;
              case 'enu':
                builder = builder.enu(name, attr.values, {
                  useNative: true,
                  enumName: `enum_${table}_${name}`,
                });
                break;
              default:
                builder = builder[type](name);
            }
            if (attr.notNullable) {
              builder = builder.notNullable();
            }
            if (attr.default !== undefined) {
              builder = builder.defaultTo(attr.default);
            }
            if (attr.unique) {
              builder = builder.unique();
            }
            if (attr.primaryKey) {
              primary.push(name);
            }
            if (attr.references) {
              builder = builder
                .references(attr.references.column)
                .inTable(attr.references.table)
                .onUpdate(attr.references.onUpdate)
                .onDelete(attr.references.onDelete);
            }
            return builder;
          });

          if (model.createdAt) {
            t.timestamp('createdAt')
              .defaultTo(knex.fn.now())
              .notNullable();
          }
          if (model.updatedAt) {
            t.timestamp('updatedAt')
              .defaultTo(knex.fn.now())
              .notNullable();
          }
          if (model.indices && model.indices.length) {
            model.indices.forEach(function(index) {
              t[index.type](index.columns);
            });
          }
          if (primary.length) {
            t.primary(primary);
          }
          return t;
        });

        if (model.updatedAt) {
          return schemaBuilder.raw(
            `
          CREATE TRIGGER ??
          BEFORE UPDATE ON ??
          FOR EACH ROW
          EXECUTE PROCEDURE on_update_timestamp();
        `,
            [`${table}_updated_at`, table],
          );
        }
      });

      return schemaBuilder;
    });
};

exports.down = function(knex, Promise) {
  return Promise.all(
    tables
      .reverse()
      .map(function(table) {
        var model = models[table];
        return knex.schema
          .raw('drop trigger if exists ?? on ??', [`${table}_updated_at`, table])
          .then(function() {
            return knex.schema.dropTableIfExists(table);
          })
          .then(function() {
            return Promise.all(
              Object.keys(model.attributes).map(function(name) {
                var attr = model.attributes[name];
                if (attr.type === 'enu') {
                  return knex.schema.raw('drop type if exists ??', [`enum_${table}_${name}`]);
                }
              }),
            );
          });
      })
      .concat([knex.schema.raw('drop function if exists on_update_timestamp() cascade')]),
  );
};

var models = require('../models').models;

exports.up = async function(knex) {
  var table = 'notifications';
  var model = models[table];

  return knex.schema.raw(`
    create or replace FUNCTION validate_notification_subject()
    RETURNS trigger AS $$
    BEGIN
      IF NEW.type = 'VIDEO_COMMENT' AND NOT EXISTS (SELECT 1 FROM ?? WHERE NEW."subjectId" = ??) THEN
        RAISE EXCEPTION 'Subject ID must be a valid comment ID, instead got %', NEW."subjectId";
      ELSIF NEW.type = 'CHANNEL_FOLLOW' AND NOT EXISTS (SELECT 1 FROM ?? WHERE NEW."subjectId" = ??) THEN
        RAISE EXCEPTION 'Subject ID must be a valid channel ID, instead got %', NEW."subjectId";
      ELSIF NOT EXISTS (SELECT 1 FROM ?? WHERE NEW."subjectId" = ??) THEN
        RAISE EXCEPTION 'Subject ID must be a valid video ID, instead got %', NEW."subjectId";
      END IF;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `, ['comments', 'comments.id', 'channels', 'channels.id', 'videos', 'videos.id'])
  .raw(`
    create or replace FUNCTION on_update_notification_cascade()
    RETURNS trigger AS $$
    BEGIN
      UPDATE notifications set "subjectId" = NEW.id where ((TG_TABLE_NAME = 'videos' and type in ('VIDEO_LIKE', 'UPLOAD_FINISH', 'UPLOAD_ERROR')) or (TG_TABLE_NAME = 'comments' and type = 'VIDEO_COMMENT') or (TG_TABLE_NAME = 'channels' and type = 'CHANNEL_FOLLOW')) and "subjectId" = OLD.id; 
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `).raw(`
      create or replace FUNCTION on_delete_notification_cascade()
      RETURNS trigger AS $$
      BEGIN
        delete from notifications where ((TG_TABLE_NAME = 'videos' and type in ('VIDEO_LIKE', 'UPLOAD_FINISH', 'UPLOAD_ERROR')) or (TG_TABLE_NAME = 'comments' and type = 'VIDEO_COMMENT') or (TG_TABLE_NAME = 'channels' and type = 'CHANNEL_FOLLOW')) and "subjectId" = OLD.id;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
  `).createTable(table, function (t) {
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
          builder = builder.enu(name, attr.values, { useNative: true, enumName: `enum_${table}_${name}` });
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
        builder = builder.references(attr.references.column)
          .inTable(attr.references.table)
          .onUpdate(attr.references.onUpdate)
          .onDelete(attr.references.onDelete);
      }
      return builder;
    });
    
    if (model.createdAt) {
      t.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    }
    if (model.updatedAt) {
      t.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();
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
  })
  .raw(`
    CREATE TRIGGER validate_notification_subject_trigger
    BEFORE INSERT OR UPDATE ON notifications
    FOR EACH ROW
    EXECUTE PROCEDURE validate_notification_subject();
  `).then(function() {
    return Promise.all(['videos', 'comments', 'channels'].map(function(subjectTable) {
      return knex.schema.raw(`
        CREATE TRIGGER ??
        AFTER UPDATE ON ??
        FOR EACH ROW
        WHEN (OLD.id <> NEW.id)
        EXECUTE PROCEDURE on_update_notification_cascade();
      `, [`${subjectTable}_${table}_update_cascade`, subjectTable])
      .raw(`
          CREATE TRIGGER ??
          AFTER DELETE ON ??
          FOR EACH ROW
          EXECUTE PROCEDURE on_delete_notification_cascade();
        `, [`${subjectTable}_${table}_delete_cascade`, subjectTable]);
    }));
  });
};

exports.down = async function(knex) {
  var table = 'notifications';
  var model = models[table];

  return knex.schema.raw('drop trigger if exists validate_notification_subject_trigger on notifications')
  .then(function() {
    return Promise.all(['videos', 'comments', 'channels'].map(function(subjectTable) {
      return knex.schema.raw(`
        drop trigger if exists ?? on ??;
      `, [`${subjectTable}_${table}_update_cascade`, subjectTable])
      .then(function() {
        return knex.schema.raw(`
          drop trigger if exists ?? on ??;
        `, [`${subjectTable}_${table}_delete_cascade`, subjectTable]);
      });
    }))
  })
  .then(function() {
    return knex.schema.dropTableIfExists(table);
  })
  .then(function() {
    return Promise.all(Object.keys(model.attributes).map(function(name) {
      var attr = model.attributes[name];
      if (attr.type === 'enu') {
        return knex.schema.raw('drop type if exists ??', [`enum_${table}_${name}`]);
      }
    }));
  })
  .then(function() {
    return Promise.all([
      knex.schema.raw('drop function if exists on_update_notification_cascade() cascade'),
      knex.schema.raw('drop function if exists on_delete_notification_cascade() cascade'),
      knex.schema.raw('drop function if exists validate_notification_subject() cascade'),
    ]);
  });
};

module.exports = function(db) {
  var uploads = function Upload() {
    if (!(this instanceof Upload)) {
      return new Upload();
    }
  };
  uploads.table = 'uploads';
  uploads.attributes = {
    id: {
      type: 'char',
      length: 12,
      primaryKey: true,
      notNullable: true,
      references: {
        column: 'id',
        table: 'videos',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    step: {
      type: 'enu',
      default: 'SHARED_UPLOAD',
      values: ['SHARED_UPLOAD', 'ENCODE', 'S3_UPLOAD', 'FINISH'],
    },
    uploaded: {
      type: 'text[]',
      default: '{}',
    },
    required: {
      type: 'integer',
    },
  };
  uploads.createdAt = true;
  uploads.updatedAt = false;

  uploads.startEncoding = function(videoId) {
    return db
      .knex(uploads.table)
      .where('id', videoId)
      .update({
        step: 'ENCODE',
        required: null,
        uploaded: '{}',
      });
  };

  uploads.finishUploading = function(videoId, file) {
    return db.knex.transaction(function(trx) {
      return db
        .knex(uploads.table)
        .where('id', videoId)
        .update(
          {
            uploaded: db.knex.raw('array_append(array_remove(??, ?), ?)', [
              `${uploads.table}.uploaded`,
              file,
              file,
            ]),
          },
          ['id', 'uploaded'],
        )
        .then(function() {
          return db
            .knex(uploads.table)
            .where(
              db.knex.raw('?? = array_length(??,1)', [
                `${uploads.table}.required`,
                `${uploads.table}.uploaded`,
              ]),
            )
            .whereNotNull(`${uploads.table}.required`)
            .del();
        })
        .then(function(deleted) {
          if (deleted > 0) {
            return db.notifications
              .addUploadFinishNotification(null, videoId, trx)
              .then(function(result) {
                return Promise.resolve('FINISH');
              });
          }
          return db.knex
            .select('step')
            .from(uploads.table)
            .where('id', videoId)
            .then(function(results) {
              if (results.length) {
                return Promise.resolve(results[0].step);
              }
              throw new Error('Upload Not Found');
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  };

  uploads.finishEncoding = function(videoId) {
    return db
      .knex(uploads.table)
      .where('id', videoId)
      .update({
        step: 'S3_UPLOAD',
      });
  };

  return uploads;
};

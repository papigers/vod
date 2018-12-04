module.exports = function(db) {
  var videoAcls = function VideoACL() {
    if (!(this instanceof VideoACL)) {
      return new VideoACL();
    }
  }

  videoAcls.table = 'videoAcls';
  videoAcls.attributes = {
    type: {
      type: 'enu',
      values: ['USER', 'AD_GROUP'],
      notNullable: true,
    },
    id: {
      type: 'string',
      primaryKey: true,
      notNullable: true,
    },
    videoId: {
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
  };
  videoAcls.createdAt = true;
  videoAcls.updatedAt = true;

  videoAcls.getvideoAcls = function(user, id) {
    return db.knex
      .select(`${videoAcls.table}.id`, `${videoAcls.table}.type`, `${videoAcls.table}.videoId`)
      .from(videoAcls.table)
      .leftJoin(db.videos.table, `${videoAcls.table}.videoId`, `${db.videos.table}.id`)
      .leftJoin(db.channels.table, `${videoAcls.table}.id`, `${db.channels.table}.id`)
      .where(`${videoAcls.table}.videoId`, id)
      .modify(db.videos.authorizedManageSubquery, user);
  }

  return videoAcls;
};

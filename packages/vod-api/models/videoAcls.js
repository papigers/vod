module.exports = function() {
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

  return videoAcls;
};

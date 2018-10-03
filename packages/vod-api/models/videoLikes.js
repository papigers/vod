module.exports = function() {
  var videoLikes = function VideoLike() {
    if (!(this instanceof VideoLike)) {
      return new VideoLike();
    }
  }

  videoLikes.table = 'videoLikes';
  videoLikes.attributes = {
    channelId: {
      type: 'string',
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'set null',
      },
    },
    videoId: {
      type: 'char',
      length: 12,
      notNullable: true,
      primaryKey: true,
      references: {
        column: 'id',
        table: 'videos',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
  };
  videoLikes.indices = [
    { type: 'primary', attributes: ['channelId', 'videoId'] },
  ];
  videoLikes.createdAt = true;
  videoLikes.updatedAt = true;

  return videoLikes;
};

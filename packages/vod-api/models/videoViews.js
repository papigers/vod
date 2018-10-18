module.exports = function(db) {
  var videoViews = function VideoView() {
    if (!(this instanceof VideoView)) {
      return new VideoView();
    }
  }

  videoViews.table = 'videoViews';
  videoViews.attributes = {
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
      references: {
        column: 'id',
        table: 'videos',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
  };
  videoViews.indices = [
    { type: 'primary', columns: ['createdAt'] },
  ];
  videoViews.createdAt = true;
  videoViews.updatedAt = false;

  return videoViews;
};

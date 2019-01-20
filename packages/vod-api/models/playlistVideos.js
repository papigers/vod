var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 10);

module.exports = function(db) {
  var playlistVideos = function PlaylistVideo() {
    if (!(this instanceof PlaylistVideo)) {
      return new PlaylistVideo();
    }
  };

  playlistVideos.table = 'playlistVideos';
  playlistVideos.attributes = {
    playlistId: {
      type: 'char',
      notNullable: true,
      references: {
        column: 'id',
        table: 'playlists',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    videoId: {
      type: 'char',
      notNullable: true,
      references: {
        column: 'id',
        table: 'videos',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    index: {
      type: 'SMALLINT',
      notNullable: true,
    },
  };
  playlistVideos.createdAt = true;
  playlistVideos.updatedAt = true;

  return playlistVideos;
};
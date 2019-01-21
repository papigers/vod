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
      length: 8,
      notNullable: true,
      primaryKey: true,
      references: {
        column: 'id',
        table: 'playlists',
        onUpdate: 'cascade',
        onDelete: 'cascade',
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
    position: {
      type: 'smallint',
      notNullable: true,
    },
  };
  playlistVideos.createdAt = true;
  playlistVideos.updatedAt = true;

  return playlistVideos;
};
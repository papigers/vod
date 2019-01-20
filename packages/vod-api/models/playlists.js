var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 10);

module.exports = function(db) {
  var playlists = function Playlist() {
    if (!(this instanceof Playlist)) {
      return new Playlist();
    }
  };

  playlists.table = 'playlists';
  playlists.attributes = {
    id: {
      type: 'char',
      length: 12,
      primaryKey: true,
      notNullable: true,
    },
    name: {
      type: 'string',
      notNullable: true,
    },
    description: {
      type: 'string',
    },
    state: {
      type: 'enu',
      default: 'PUBLIC',
      values: ['PRIVATE', 'PUBLIC', 'UNLISTED'],
      notNullable: true,
    },
    channelId: {
      type: 'string',
      notNullable: true,
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
  };
  playlists.createdAt = true;
  playlists.updatedAt = true;

  playlists.getPlaylists = function(user) {
    return db.knexnest(db.knex
      .select(
        `${playlists.table}.id as _id`,
        `${playlists.table}.name as _name`,
        `${playlists.table}.description as _description`,
        `${playlists.table}.state as _state`,
        `${db.videos.table}.id as _videos__id`,
        `${db.videos.table}.name as _videos__name`,
        `${db.videos.table}.description as _videos__description`,
        `${db.playlistVideos.table}.index as _videos__index`,
        `${db.channels.table}.id as _channel_id`,
        `${db.channels.table}.name as _channel_name`,
        `${db.channels.table}.personal as _channel_personal`,
        `${playlists.table}.createdAt as _createdAt`,
        `${playlists.table}.updatedAt as _updatedAt`,
      )
      .from(playlists.table)
      .leftJoin(db.playlistVideos.table, `${playlists.table}.id`, `${db.playlistVideos.table}.playlistId`)
      .leftJoin(db.channels.table, `${playlists.table}.channelId`, `${db.channels.table}.id`)
      .leftJoin(db.videos.table, `${playlists.table}.videoId`, `${db.videos.table}.id`)
      .orderBy(`${playlists.table}.personal`, 'desc')
      .orderBy(`${playlists.table}.name`, 'desc')
      .orderBy(`${playlists.table}.createdAt`, 'desc')
      .orderBy('_videos__index')
      .modify(db.channels.authorizedViewSubquery, user)
    , true);
  };

  playlists.getPlaylist = function(user, id) {
    return db.knexnest( db.knex
      .select(
        `${playlists.table}.id as _id`,
        `${playlists.table}.name as _name`,
        `${playlists.table}.description as _description`,
        `${playlists.table}.state as _state`,
        `${db.videos.table}.id as _videos__id`,
        `${db.videos.table}.name as _videos__name`,
        `${db.videos.table}.description as _videos__description`,
        `${db.playlistVideos.table}.index as _videos__index`,
        `${db.channels.table}.id as _channel_id`,
        `${db.channels.table}.name as _channel_name`,
        `${db.channels.table}.personal as _channel_personal`,
        `${playlists.table}.createdAt as _createdAt`,
        `${playlists.table}.updatedAt as _updatedAt`,
      )
      .from(playlists.table)
      .where(`${playlists.table}.id`, id)
      .leftJoin(db.playlistVideos.table, `${playlists.table}.id`, `${db.playlistVideos.table}.playlistId`)
      .leftJoin(db.channels.table, `${playlists.table}.channelId`, `${db.channels.table}.id`)
      .leftJoin(db.videos.table, `${playlists.table}.videoId`, `${db.videos.table}.id`)
      .orderBy(`${playlists.table}.personal`, 'desc')
      .orderBy(`${playlists.table}.name`, 'desc')
      .orderBy(`${playlists.table}.createdAt`, 'desc')
      .orderBy('_videos__index')
      .modify(db.channels.authorizedViewSubquery, user)
    , true);
  };

  // TODO: create playlist
  playlists.createPlaylist = function(user, id) {
    return true;
  };

  // TODO: update playlist
  playlists.updatePlaylist = function(user, id) {
    return true;
  };

  return playlists;
};
var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 8);

function PlaylistError(message, code) {
  this.message = message;
  this.code = code;
}
PlaylistError.prototype = new Error();

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
      length: 8,
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
        `${db.playlistVideos.table}.position as _videos__position`,
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
      .orderBy('_videos__position')
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
        `${db.playlistVideos.table}.position as _videos__position`,
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
      .orderBy('_videos__position')
      .modify(db.channels.authorizedViewSubquery, user)
    , true);
  };

  playlists.createPlaylist = function(user, playlist) {
    var playlistId = generateId();
    return db.knex.transaction(function(trx) {
      return trx(playlists.table)
        .insert({
          id: playlistId,
          name: playlist.name,
          description: playlist.description,
          state: playlist.state,
          channelId: playlist.channelId,
        })
        .modify(channels.authorizedManageSubquery, user, playlists)
        .then(({data}) => {
          if (data) {
            return trx(playlistVideos.table)
            .where('playlistId', data.id)
            .modify(db.channels.authorizedManageSubquery, user)
            .del()
            .then(() => {
              var videos = playlist.videos || [];
              var position;
              return videos.map(video => {
                position = videos.indexOf(video);
                return trx(playlistVideos.table)
                .insert({
                  playlistId: playlistId,
                  videoId: video.id,
                  position: position,
                })
              });
            });
          }
          return trx.rollback(
            new PlaylistError(
            "you don't have permissionsn to create this playlist",
            403
            ));
        })
        .catch(function(err) {
          return trx.rollback(new PlaylistError(err, 500));
        });
      });
  };

  playlists.updatePlaylist = function(user, playlist) {
    return db.knex.transaction(function(trx) {
      return trx(playlists.table)
        .update({
          name: playlist.name,
          description: playlist.description,
          state: playlist.state,
        })
        .where('id', playlist.id)
        .modify(channels.authorizedManageSubquery, user, playlists)
        .then(({data}) => {
          if (data) {
            return trx(playlistVideos.table)
            .where('playlistId', data.id)
            .modify(db.channels.authorizedManageSubquery, user)
            .del()
            .then(() => {
              var videos = playlist.videos || [];
              var position;
              return videos.map(video => {
                position = videos.indexOf(video);
                return trx(playlistVideos.table)
                .insert({
                  playlistId: playlistId,
                  videoId: video.id,
                  position: position,
                })
              });
            });
          }
          return trx.rollback(
            new PlaylistError(
            "you don't have permissionsn to update this playlist",
            403
            ));
        })
        .catch(function(err) {
          return trx.rollback(new PlaylistError(err.message, err.code));
        });
      });
  };

  playlists.deletePlaylist = function(user, id) {
    return db.knex(playlists.table)
    .where('id', id)
    .modify(db.channels.authorizedManageSubquery, user)
    .del()
    .then(({data}) => {
      if (!data) {
        return trx.rollback(
          new PlaylistError(
            "you don't have permissionsn to delete this playlist",
            403
            ));
      }})
    .catch(function(err) {
      return trx.rollback(new PlaylistError(err.message, err.code));
    });
  };

  return playlists;
};
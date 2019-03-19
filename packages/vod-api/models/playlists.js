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
      default: 'PUBLISHED',
      values: ['PUBLISHED', 'UNLISTED', 'DRAFT'],
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

  playlists.getManagedPlaylists = function(user) {
    return db.knexnest(
      db.knex
        .select(
          `${playlists.table}.id as _id`,
          `${playlists.table}.name as _name`,
          `${playlists.table}.description as _description`,
          `${playlists.table}.state as _state`,
          `playlistVideo.id as _videos__id`,
          `playlistVideo.name as _videos__name`,
          `playlistVideo.description as _videos__description`,
          `playlistVideo.state as _videos__state`,
          `videoChannel.id as _videos__channel_id`,
          `videoChannel.name as _videos__channel_name`,
          `videoChannel.personal as _videos__channel_personal`,
          `${db.playlistVideos.table}.position as _videos__position`,
          `${db.channels.table}.id as _channel_id`,
          `${db.channels.table}.name as _channel_name`,
          `${db.channels.table}.personal as _channel_personal`,
          `${playlists.table}.createdAt as _createdAt`,
          `${playlists.table}.updatedAt as _updatedAt`,
        )
        .from(playlists.table)
        .leftJoin(
          db.playlistVideos.table,
          `${playlists.table}.id`,
          `${db.playlistVideos.table}.playlistId`,
        )
        .leftJoin(`${db.channels.table}`, `${playlists.table}.channelId`, `${db.channels.table}.id`)
        .leftJoin(
          `${db.videos.table} as playlistVideo`,
          `${db.playlistVideos.table}.videoId`,
          `playlistVideo.id`,
        )
        .leftJoin(
          `${db.channels.table} as videoChannel`,
          `playlistVideo.channelId`,
          `videoChannel.id`,
        )
        .orderBy(`${db.channels.table}.personal`, 'desc')
        .orderBy(`${playlists.table}.name`, 'desc')
        .orderBy(`${playlists.table}.createdAt`, 'desc')
        .orderBy('_videos__position')
        .modify(db.channels.authorizedViewSubquery, user),
      true,
    );
  };

  playlists.getPlaylist = function(user, id) {
    return db.knexnest(
      db.knex
        .select(
          `${playlists.table}.id as _id`,
          `${playlists.table}.name as _name`,
          `${playlists.table}.description as _description`,
          `${playlists.table}.state as _state`,
          `playlistVideo.id as _videos__id`,
          `playlistVideo.name as _videos__name`,
          `playlistVideo.description as _videos__description`,
          `playlistVideo.state as _videos__state`,
          `videoChannel.id as _videos__channel_id`,
          `videoChannel.name as _videos__channel_name`,
          `videoChannel.personal as _videos__channel_personal`,
          `${db.playlistVideos.table}.position as _videos__position`,
          `${db.channels.table}.id as _channel_id`,
          `${db.channels.table}.name as _channel_name`,
          `${db.channels.table}.personal as _channel_personal`,
          `${playlists.table}.createdAt as _createdAt`,
          `${playlists.table}.updatedAt as _updatedAt`,
        )
        .from(playlists.table)
        .where(`${playlists.table}.id`, id)
        .leftJoin(
          db.playlistVideos.table,
          `${playlists.table}.id`,
          `${db.playlistVideos.table}.playlistId`,
        )
        .leftJoin(`${db.channels.table}`, `${playlists.table}.channelId`, `${db.channels.table}.id`)
        .leftJoin(
          `${db.videos.table} as playlistVideo`,
          `${db.playlistVideos.table}.videoId`,
          `playlistVideo.id`,
        )
        .leftJoin(
          `${db.channels.table} as videoChannel`,
          `playlistVideo.channelId`,
          `videoChannel.id`,
        )
        .orderBy(`${db.channels.table}.personal`, 'desc')
        .orderBy(`${playlists.table}.name`, 'desc')
        .orderBy(`${playlists.table}.createdAt`, 'desc')
        .orderBy('_videos__position')
        .modify(db.channels.authorizedViewSubquery, user),
      true,
    );
  };

  playlists.createPlaylist = function(user, playlist) {
    var playlistId = generateId();
    return db.knex.transaction(function(trx) {
      return trx
        .select()
        .from(db.channels.table)
        .where(`${db.channels.table}.id`, playlist.channelId)
        .modify(db.channels.authorizedManageSubquery, user)
        .then(rows => {
          if (rows.length > 0) {
            return trx(playlists.table)
              .insert({
                id: playlistId,
                name: playlist.name,
                description: playlist.description,
                state: playlist.state,
                channelId: playlist.channelId,
              })
              .then(inserts => {
                if (inserts) {
                  var videos = playlist.videos || [];
                  return Promise.all(
                    videos.map(video => {
                      var position = videos.indexOf(video);
                      return trx(db.playlistVideos.table).insert({
                        playlistId: playlistId,
                        videoId: video.id,
                        position: position,
                      });
                    }),
                  );
                }
              });
          }
        })
        .catch(function(err) {
          return trx.rollback(new PlaylistError(err, 500));
        });
    });
  };

  playlists.updatePlaylist = function(user, id, playlist) {
    return db.knex.transaction(function(trx) {
      return trx(`${playlists.table}`)
        .where('id', id)
        .andWhere(function() {
          this.whereIn(`${playlists.table}.channelId`, function() {
            this.select(`${db.channels.table}.id`)
              .from(db.channels.table)
              .modify(db.channels.authorizedManageSubquery, user);
          });
        })
        .update({
          name: playlist.name,
          description: playlist.description,
          state: playlist.state,
        })
        .then(updatedRows => {
          if (updatedRows) {
            return trx(db.playlistVideos.table)
              .where('playlistId', id)
              .del()
              .then(() => {
                var videos = playlist.videos || [];
                var position = 0;
                return Promise.all(
                  videos.map(video => {
                    return trx(db.playlistVideos.table).insert({
                      playlistId: id,
                      videoId: video.id,
                      position: position++,
                    });
                  }),
                );
              });
          }
        })
        .catch(function(err) {
          return trx.rollback(new PlaylistError(err.message, err.code));
        });
    });
  };

  playlists.addVideoToPlaylist = function(user, id, videoId) {
    return db
      .knexnest(
        db.knex
          .select(
            `${playlists.table}.id as _id`,
            `${db.playlistVideos.table}.videoId as _videos__videoId`,
            `${db.playlistVideos.table}.position as _videos__position`,
            `${playlists.table}.channelId as _channelId`,
          )
          .from(playlists.table)
          .where(`${playlists.table}.id`, id)
          .leftJoin(
            db.playlistVideos.table,
            `${playlists.table}.id`,
            `${db.playlistVideos.table}.playlistId`,
          )
          .leftJoin(db.channels.table, `${db.channels.table}.id`, `${playlists.table}.channelId`)
          .modify(db.channels.authorizedManageSubquery, user),
      )
      .then(function(rows) {
        if (rows.length) {
          var playlist = rows[0];
          if (playlist.videos.filter(video => video.videoId === videoId).length) {
            return new PlaylistError('The playlist already contains this video', 200);
          }
          var position =
            playlist.videos.reduce((max, video) => {
              return Math.max(max, video.position);
            }, 0) + 1;
          return db.knex(db.playlistVideos.table).insert({
            playlistId: id,
            videoId: videoId,
            position: position,
          });
        }
      })
      .then(function() {
        return db.knex(playlists.table)
        .where('id', id)
        .update({
          id: id,
        });
      })
      .catch(function(err) {
        return new PlaylistError(err.message, err.code);
      });
  };

  playlists.removeVideoFromPlaylist = function(user, id, videoId) {
    return db
      .knexnest(
        db.knex
          .select(
            `${playlists.table}.id as _id`,
            `${db.playlistVideos.table}.videoId as _videos__videoId`,
            `${db.playlistVideos.table}.position as _videos__position`,
            `${playlists.table}.channelId as _channelId`,
          )
          .from(playlists.table)
          .where(`${playlists.table}.id`, id)
          .leftJoin(
            db.playlistVideos.table,
            `${playlists.table}.id`,
            `${db.playlistVideos.table}.playlistId`,
          )
          .leftJoin(db.channels.table, `${db.channels.table}.id`, `${playlists.table}.channelId`)
          .modify(db.channels.authorizedManageSubquery, user),
      )
      .then(function(rows) {
        if (rows.length) {
          var playlist = rows[0];
          if (!playlist.videos.filter(video => video.videoId === videoId).length) {
            return new PlaylistError('The playlist does not contain this video', 200);
          }
          return db
            .knex(db.playlistVideos.table)
            .where('playlistId', id)
            .andWhere('videoId', videoId)
            .del();
        }
      })
      .then(function() {
        return db.knex(playlists.table)
        .where('id', id)
        .update({
          id: id,
        });
      })
      .catch(function(err) {
        return new PlaylistError(err.message, err.code);
      });
  };

  playlists.deletePlaylist = function(user, id) {
    return db
      .knexnest(
        db.knex
          .select(
            `${playlists.table}.id as _id`,
            `${db.playlistVideos.table}.videoId as _videos__videoId`,
            `${db.playlistVideos.table}.position as _videos__position`,
            `${db.channels.table}.id as _channelId`,
          )
          .from(playlists.table)
          .where(`${playlists.table}.id`, id)
          .leftJoin(
            db.playlistVideos.table,
            `${playlists.table}.id`,
            `${db.playlistVideos.table}.playlistId`,
          )
          .leftJoin(db.channels.table, `${db.channels.table}.id`, `${playlists.table}.channelId`)
          .modify(db.channels.authorizedManageSubquery, user)
      )
      .then(function(rows) {
        if (rows.length) {
          return db.knex(playlists.table)
            .where('id', id)
            .del()
        }
      })
      .catch(function(err) {
        return new PlaylistError(err.message, err.code);
      });
  };

  return playlists;
};

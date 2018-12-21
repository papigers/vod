var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 18);

module.exports = function(db) {
  var notifications = function Notifications() {
    if (!(this instanceof Notifications)) {
      return new Notifications();
    }
  };

  notifications.table = 'notifications';
  notifications.generateId = generateId;
  notifications.attributes = {
    id: {
      type: 'char',
      length: 18,
      primaryKey: true,
      unique: true,
    },
    type: {
      type: 'enu',
      values: ['VIDEO_LIKE', 'VIDEO_COMMENT', 'CHANNEL_FOLLOW', 'UPLOAD_FINISH', 'UPLOAD_ERROR'],
      notNullable: true,
    },
    subjectId: {
      type: 'string',
      notNullable: true,
    },
    senderId: {
      type: 'string',
      notNullable: true,
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    unread: {
      type: 'boolean',
      default: true,
    },
  };
  notifications.createdAt = true;
  notifications.updatedAt = false;

  notifications.addNotification = function(user, type, subject, trx) {
    var id = generateId();
    var senderId = user && user.id;
    if (type === 'UPLOAD_FINISH' || type === 'UPLOAD_ERROR') {
      senderId = db.knex
        .select('creatorId')
        .from(db.videos.table)
        .where('id', subject);
    }
    var qb = db.knex(notifications.table).insert({
      id,
      type,
      senderId,
      subjectId: subject,
    });
    if (trx) {
      qb.transacting(trx);
    }
    return qb;
  };

  notifications.addVideoLikeNotification = function(user, videoId, trx) {
    return notifications.addNotification(user, 'VIDEO_LIKE', videoId, trx);
  };

  notifications.addVideoCommentNotification = function(user, commentId, trx) {
    return notifications.addNotification(user, 'VIDEO_COMMENT', commentId, trx);
  };

  notifications.addChannelFollowNotification = function(user, channelId, trx) {
    return notifications.addNotification(user, 'CHANNEL_FOLLOW', channelId, trx);
  };

  notifications.addUploadFinishNotification = function(user, videoId, trx) {
    return notifications.addNotification(user, 'UPLOAD_FINISH', videoId, trx);
  };

  notifications.addUploadErrorNotification = function(user, videoId, trx) {
    return notifications.addNotification(user, 'UPLOAD_ERROR', videoId, trx);
  };

  notifications.removeNotification = function(user, type, subject, trx) {
    var qb = db
      .knex(notifications.table)
      .where({
        type,
        senderId: user && user.id,
        subjectId: subject,
      })
      .del();
    if (trx) {
      qb.transacting(trx);
    }
    return qb;
  };

  notifications.removeVideoLikeNotification = function(user, videoId, trx) {
    return notifications.removeNotification(user, 'VIDEO_LIKE', videoId, trx);
  };

  notifications.removeVideoCommentNotification = function(user, commentId, trx) {
    return notifications.removeNotification(user, 'VIDEO_COMMENT', commentId, trx);
  };

  notifications.removeChannelFollowNotification = function(user, channelId, trx) {
    return notifications.removeNotification(user, 'CHANNEL_FOLLOW', channelId, trx);
  };

  notifications.removeUploadFinishNotification = function(user, videoId, trx) {
    return notifications.removeNotification(user, 'UPLOAD_FINISH', videoId, trx);
  };

  notifications.removeUploadErrorNotification = function(user, videoId, trx) {
    return notifications.removeNotification(user, 'UPLOAD_ERROR', videoId, trx);
  };

  notifications.getChannelNotifications = function(user, before) {
    var unreadSubQuery = db.knex
      .table(db.notificationReceipts.table)
      .select(1)
      .where('channelId', user && user.id)
      .andWhere('notificationId', db.knex.raw('??', [`${notifications.table}.id`]))
      .limit(1);
    var query = db.knex
      .select(
        db.knex.raw('?? || ? || ?? || ? || NOT EXISTS(?) as "_groupId"', [
          `${notifications.table}.type`,
          '_',
          `${notifications.table}.subjectId`,
          '_unread_',
          unreadSubQuery,
        ]),
      )
      .select(`${notifications.table}.id as _notifications__id`)
      .select(`${notifications.table}.createdAt as _notifications__createdAt`)
      .select(`${notifications.table}.type as _type`)
      .select(`${db.comments.table}.id as _comment_id`)
      .select(`${db.comments.table}.comment as _comment_comment`)
      .select('commentVideo.id as _comment_video_id')
      .select('commentVideo.name as _comment_video_name')
      .select('commentVideoChannel.id as _comment_video_channel_id')
      .select('commentVideoChannel.name as _comment_video_channel_name')
      .select(`${db.videos.table}.id as _video_id`)
      .select(`${db.videos.table}.name as _video_name`)
      .select('videoChannel.id as _video_channel_id')
      .select('videoChannel.name as _video_channel_name')
      .select(`${db.channels.table}.id as _channel_id`)
      .select(`${db.channels.table}.name as _channel_name`)
      .select(`sender.id as _senders__id`)
      .select(`sender.name as _senders__name`)
      .select(`${notifications.table}.createdAt as _createdAt`)
      .select(db.knex.raw('NOT EXISTS(?) as ??', [unreadSubQuery, '_unread']))
      .from(notifications.table)
      .orderBy(`${notifications.table}.createdAt`, 'desc')
      .limit(10)
      .innerJoin(`${db.channels.table} as sender`, `${notifications.table}.senderId`, 'sender.id')
      .leftJoin(db.comments.table, function() {
        this.on(`${notifications.table}.type`, db.knex.raw('?', ['VIDEO_COMMENT'])).andOn(
          `${notifications.table}.subjectId`,
          `${db.comments.table}.id`,
        );
      })
      .leftJoin(db.videos.table, function() {
        this.onIn(`${notifications.table}.type`, [
          'VIDEO_LIKE',
          'UPLOAD_FINISH',
          'UPLOAD_ERROR',
        ]).andOn(`${notifications.table}.subjectId`, `${db.videos.table}.id`);
      })
      .leftJoin(`${db.videos.table} as commentVideo`, function() {
        this.on(`${notifications.table}.type`, db.knex.raw('?', ['VIDEO_COMMENT'])).andOn(
          `${db.comments.table}.videoId`,
          `commentVideo.id`,
        );
      })
      .leftJoin(`${db.channels.table} as commentVideoChannel`, function() {
        this.on(`${notifications.table}.type`, db.knex.raw('?', ['VIDEO_COMMENT'])).andOn(
          `commentVideo.channelId`,
          `commentVideoChannel.id`,
        );
      })
      .leftJoin(db.channels.table, function() {
        this.on(`${notifications.table}.type`, db.knex.raw('?', ['CHANNEL_FOLLOW'])).andOn(
          `${notifications.table}.subjectId`,
          `${db.channels.table}.id`,
        );
      })
      .leftJoin(`${db.channels.table} as videoChannel`, function() {
        this.onIn(`${notifications.table}.type`, [
          'VIDEO_LIKE',
          'UPLOAD_FINISH',
          'UPLOAD_ERROR',
        ]).andOn(`${db.videos.table}.channelId`, `videoChannel.id`);
      })
      .where(function() {
        this.where(`${notifications.table}.senderId`, '<>', user && user.id).orWhereIn(
          `${notifications.table}.type`,
          ['UPLOAD_FINISH', 'UPLOAD_ERROR'],
        );
      })
      .where(function() {
        this.where(function() {
          this.where(function() {
            this.where(`${notifications.table}.type`, 'VIDEO_LIKE')
              .orWhere(`${notifications.table}.type`, 'UPLOAD_FINISH')
              .orWhere(`${notifications.table}.type`, 'UPLOAD_ERROR');
          }).whereIn(`${notifications.table}.subjectId`, function() {
            this.select(`${db.videos.table}.id`)
              .from(db.videos.table)
              .modify(db.videos.authorizedManageSubquery, user);
          });
        })
          .orWhere(function() {
            this.where(`${notifications.table}.type`, 'VIDEO_COMMENT').whereIn(
              `${notifications.table}.subjectId`,
              function() {
                this.select(`${db.comments.table}.id`)
                  .from(db.comments.table)
                  .leftJoin(
                    db.videos.table,
                    `${db.comments.table}.videoId`,
                    `${db.videos.table}.id`,
                  )
                  .modify(db.videos.authorizedManageSubquery, user);
              },
            );
          })
          .orWhere(function() {
            this.where(`${notifications.table}.type`, 'CHANNEL_FOLLOW').whereIn(
              `${notifications.table}.subjectId`,
              function() {
                this.select(`${db.channels.table}.id`)
                  .from(db.channels.table)
                  .modify(db.channels.authorizedManageSubquery, user);
              },
            );
          });
      });
    if (before) {
      query.andWhere(`${notifications.table}.createdAt`, '<', before);
    }
    return db.knexnest(query, true);
  };

  return notifications;
};

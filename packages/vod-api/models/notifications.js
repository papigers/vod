var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 18);

module.exports = function(db) {
  var notifications = function Notifications() {
    if (!(this instanceof Notifications)) {
      return new Notifications();
  
  }

  notifications.table = 'notifications';
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
    var qb = trx || db.knex;
    var id = generateId();
    return qb(notifications.table).insert({
      id,
      type,
      senderId: user && user.id,
      subjectId: subject,
    })
  }

  notifications.addVideoLikeNotification = function(user, videoId, trx) {
    return notifications.addNotification(user, 'VIDEO_LIKE', videoId, trx);
  }

  notifications.addVideoCommentNotification = function(user, commentId, trx) {
    return notifications.addNotification(user, 'VIDEO_COMMENT', commentId, trx);
  }

  notifications.addChannelFollowNotification = function(user, channelId, trx) {
    return notifications.addNotification(user, 'CHANNEL_FOLLOW', channelId, trx);
  }

  notifications.addUploadFinishNotification = function(user, videoId, trx) {
    return notifications.addNotification(user, 'UPLOAD_FINISH', videoId, trx);
  }

  notifications.addUploadErrorNotification = function(user, videoId, trx) {
    return notifications.addNotification(user, 'UPLOAD_ERROR', videoId, trx);

  }

  notifications.getChannelNotifications = function(user) {
    return db.knex
    .select(`${notifications.table}.id as _id`)
    .select(`${notifications.table}.type as _type`)
    .select(`${notifications.table}.subject as _subject`)
    .select(`${db.comments.table}.id as _comment_id`)
    .select(`${db.comments.table}.comment as _comment_comment`)
    .select(
      db.knex.raw('(case when ?? = ? then ?? end) as ??'),
      [`${notifications.table}.type`, 'VIDEO_COMMENT', `${db.videos.table}.id`, '_comment_video_id'],
    )
    .select(
      db.knex.raw('(case when ?? = ? then ?? end) as ??'),
      [`${notifications.table}.type`, 'VIDEO_COMMENT', `${db.videos.table}.name`, '_comment_video_name'],
    )
    .select(`${db.videos.table}.id as _video_id`)
    .select(`${db.videos.table}.name as _video_name`)
    .select(
      db.knex.raw('(case when ?? in (?, ?, ?) then ?? end) as ??'),
      [`${notifications.table}.type`, 'VIDEO_LIKE', 'UPLOAD_FINISH', 'UPLOAD_ERROR', `${db.channels.table}.id`, '_video_channel_id'],
    )
    .select(
      db.knex.raw('(case when ?? in (?, ?, ?) then ?? end) as ??'),
      [`${notifications.table}.type`, 'VIDEO_LIKE', 'UPLOAD_FINISH', 'UPLOAD_ERROR', `${db.channels.table}.name`, '_video_channel_name'],
    )
    .select(`${db.channels.table}.id as _channel_id`)
    .select(`${db.channels.table}.name as _channel_name`)
    .select(`sender.id as _sender_id`)
    .select(`sender.name as _sender_name`)
    .select(`${notifications.table}.unread as _unread`)
    .from(notifications.table)
    .innerJoin(`${db.channels.table} as sender`, `${notifications.table}.senderId`, `${db.channels.table}.id`)
    .leftJoin(db.comments.table, function() {
      this.on(`${notifications.table}.type`, db.knex.raw('?', ['VIDEO_COMMENT']))
      .andOn(`${notifications.table}.subjectId`, `${db.comments.table}.id`);
    })
    .leftJoin(db.videos.table, function() {
      this.on(function() {
        this.onIn(`${notifications.table}.type`, ['VIDEO_LIKE', 'UPLOAD_FINISH', 'UPLOAD_ERROR'])
        .andOn(`${notifications.table}.subjectId`, `${db.videos.table}.id`);
      })
      .orOn(function() {
        this.on(`${notifications.table}.type`, db.knex.raw('?', ['VIDEO_COMMENT']))
        .andOn(`${db.comments.table}.videoId`, `${db.videos.table}.id`);
      });
    })
    .leftJoin(db.videos.table, function() {
      this.on(function() {
        this.on(`${notifications.table}.type`, db.knex.raw('?', ['CHANNEL_FOLLOW']))
        .andOn(`${notifications.table}.subjectId`, `${db.channels.table}.id`);
      })
      .orOn(function() {
        this.on(`${notifications.table}.type`, '<>', db.knex.raw('?', ['CHANNEL_FOLLOW']))
        .andOn(`${db.videos.table}.channelId`, `${db.channels.table}.id`);
      });
    })
    .leftJoin(db.channels.table, `${notifications.table}.channelId`, `${db.channels.table}.id`)
    .where(function() {
      this.where(function() {
        this.where(`${notifications.table}.type`, 'VIDEO_LIKE')
        .orWhere(`${notifications.table}.type`, 'UPLOAD_FINISH')
        .orWhere(`${notifications.table}.type`, 'UPLOAD_ERROR')
      })
      .andWhereIn(`${notifications.table}.subject`, function() {
        this.select('id').from(db.videos.table)
          .modify(db.channel.authorizedManageSubquery, user);
      });
    })
    .orWhere(function() {
      this.where(`${notifications.table}.type`, 'VIDEO_COMMENT')
      .andWhereIn(`${notifications.table}.subject`, function() {
        this.select('id').from(db.comments.table)
          .leftJoin(db.videos.table, `${db.comments}.videoId`, `${db.videos}.id`)
          .modify(db.videos.authorizedManageSubquery, user);
      });
    })
    .orWhere(function() {
      this.where(`${notifications.table}.type`, 'CHANNEL_FOLLOW')
      .andWhereIn(`${notifications.table}.subject`, function() {
        this.select('id').from(db.channels.table)
          .modify(db.channels.authorizedManageSubquery, user)
      });
    })
  }

  return notifications;
};

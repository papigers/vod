var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 10);

module.exports = function(db) {
  var comments = function Comment() {
    if (!(this instanceof Comment)) {
      return new Comment();
    }
  }

  comments.table = 'comments';
  comments.attributes = {
    comment: {
      type: 'string',
      notNullable: true,
    },
    id: {
      type: 'char',
      length: 10,
      primaryKey: true,
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
  comments.createdAt = true;
  comments.updatedAt = true;

  comments.getComments = function(user, videoId, { page, before }) {
    var query = db.knex
      .select(`${comments.table}.id as _id`, `${comments.table}.comment as _comment`, `${comments.table}.createdAt as _createdAt`, `${db.channels.table}.id as _channel_id`, `${db.channels.table}.name as _channel_name`)
      .from(comments.table)
      .leftJoin(db.channels.table, `${comments.table}.channelId`, `${db.channels.table}.id`)
      .orderBy(`${comments.table}.createdAt`, 'desc')
      .limit(20)
      .where('videoId', videoId)
      .modify(db.channels.authorizedViewSubquery, user)
      .modify(db.videos.authorizedViewSubquery, user);
    if (page) {
      query.offset(page * 20);
    }
    if (before) {
      query.andWhere(`${comments.table}.createdAt`, '<', before);
    }
    return db.knexnest(query, true);
  }

  comments.postComment = function(user, videoId, comment) {
    return db.knex(db.knex.raw('?? (??, ??, ??, ??)', [comments.table, 'id', 'comment', 'videoId', 'channelId'])).insert(
      db.knex.select(db.knex.raw('?, ?, ?, ?', [generateId(), comment, videoId, user && user.id])).from(db.videos.table)
        .where(`${db.videos.table}.id`, videoId).modify(db.videos.authorizedViewSubquery, user)
    );
  }

  return comments;
};

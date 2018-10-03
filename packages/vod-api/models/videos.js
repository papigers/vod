var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 12);

module.exports = function(knex) {
  var videos = function Video() {
    if (!(this instanceof Video)) {
      return new Video();
    }
  }
  videos.table = 'videos';
  video.attributes = {
    id: {
      type: 'char',
      length: 12,
      primaryKey: true,
      notNullable: true,
    },
    published: {
      type: 'boolean',
      default: false,
    },
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    privacy: {
      type: 'enu',
      default: 'PUBLIC',
      values: ['PUBLIC', 'PRIVATE', 'CHANNEL'],
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
    creatorId: {
      type: 'string',
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'set null',
      },
    },
  };
  videos.createdAt = true;
  videos.updatedAt = true;

  videos.authorizedManage = function(queryBuilder, user, options = {}) {
    var userId = user && user.id;
    var groups = user && user.groups || [];
    var tableName = options.table || videos.table;
    var channelsName = options.channelsTable || db.channels.table;
    var channelAclName = options.channelsTable ? `${db.channelAcls.table}_${options.channelsTable}` : db.channelAcls.table;

    return queryBuilder.leftJoin(`${db.channels.table} as ${channelsName}`, `${tableName}.channelId`, `${channelsName}.id`)
      .leftJoin(`${db.channelAcls.table} as ${channelAclName}`, `${channelsName}.id`, `${channelAclName}.channelId`)
      .where(function() {
        this.where(`${channelsName}.id`, userId)
        .orWhere(function() {
          this.where(`${channelAclName}.access`, 'MANAGE')
          .andWhere(function() {
            this.where(function() {
              this.where(`${channelAclName}.id`, userId)
                .andWhere(`${channelAclName}.type`, 'USER')
            })
            .orWhere(function() {
              this.whereIn(`${channelAclName}.id`, groups)
                .andWhere(`${channelAclName}.type`, 'AD_GROUP')
            });
          });
        });
      });
  }

  videos.authorizedManageSubquery = function(queryBuilder, user, options) {
    return queryBuilder.whereIn('id', function() {
      this.select(`${videos.table}.id`).from(videos.table).modify(videos.authorizedManage, user, options);
    });
  }

  videos.authorizedView = function(queryBuilder, user, options = {}) {
    var userId = user && user.id;
    var groups = user && user.groups || [];
    var tableName = options.table || videos.table;
    var channelsName = options.channelsTable || db.channels.table;
    var aclName = options.table ? `${db.videoAcls.table}_${options.table}` : db.videoAcls.table;
    var channelAclName = options.channelsTable ? `${db.channelAcls.table}_${options.channelsName}` : db.channelAcls.table;
      
    return queryBuilder.leftJoin(`${db.videoAcls.table} as ${aclName}`, `${tableName}.id`, `${aclName}.videoId`)
      .leftJoin(`${db.channels.table} as ${channelsName}`, `${tableName}.channelId`, `${channelsName}.id`)
      .leftJoin(`${db.channelAcls.table} as ${channelAclName}`, `${channelsName}.id`, `${channelAclName}.channelId`)
      .where(function() {
        this.where(`${tableName}.id`, userId)
        .orWhere(`${tableName}.privacy`, 'PUBLIC')
        .orWhere(function() {
          this.where(`${tableName}.privacy`, '<>', 'PUBLIC')
          .andWhere(function() {
            this.where(function() {
              this.where(`${aclName}.id`, userId)
                .andWhere(`${aclName}.type`, 'USER')
            })
            .orWhere(function() {
              this.whereIn(`${aclName}.id`, groups)
                .andWhere(`${aclName}.type`, 'AD_GROUP')
            });
          });
        })
        .orWhere(function() {
          this.where(`${tableName}.privacy`, 'CHANNEL')
          .andWhere(function() {
            this.where(function() {
              this.where(`${channelAclName}.id`, userId)
                .andWhere(`${channelAclName}.type`, 'USER')
            })
            .orWhere(function() {
              this.whereIn(`${channelAclName}.id`, groups)
                .andWhere(`${channelAclName}.type`, 'AD_GROUP')
            });
          });
        });
      });
  }

  videos.authorizedViewSubquery = function(queryBuilder, user, options) {
    return queryBuilder.whereIn('id', function() {
      this.select(`${videos.table}.id`).from(videos.table).modify(videos.authorizedManage, user, options);
    });
  }

  videos.initialCreate = function(user, video) {
    return db.knex.transaction(function(trx) {
      return trx.select().from(videos.table).where('name', video.name).andWhere('published', false)
        .then(function(res) {
          if (res.length === 0) {
            return trx(videos.table).insert({
              id: generateId(),
              name: video.name,
              published: false,
              channelId: video.channel,
              creatorId: video.creator,
            }).then(function() {
              return trx.select().from(videos.table).where('name', video.name);
            });
          }
          return res[0];
        });
    });
  }

  videos.edit = function(user, id, video) {
    return db.knex.transaction(function(trx) {
      return trx(videos.table)
        .update({
          name: video.name,
          description: video.description,
          privacy: video.privacy,
          published: video.published,
        })
        .where('id', id)
        .modify(videos.authorizedManageSubquery, user)
        .then(function() {
          return trx(db.videoAcls.table).where('videoId', id).del();
        })
        .then(function() {
          if (video.privacy !== 'PUBLIC') {
            return Promise.all(video.acl.map(function(acl) {
              return trx(db.videoAcls.table).insert({
                videoId: id,
                id: acl.id,
                type: acl.type,
              });
            }));
          }
          return Promise.resolve(video);
        })
        .then(function() {
          return trx(db.tags.table).where('itemId', id).whereNotIn('tag', video.tags).del();
        })
        .then(function() {
          return Promise.all(video.tags.map(function(tag) {
            trx(trx.raw('?? (??, ??, ??)', [db.tags.table, 'tag', 'taggable', 'itemId'])).insert(
              trx.select(trx.raw('?, ?, ?', [tag, 'VIDEO', id])).from(db.tags.table)
                .whereNotExists(function() {
                  this.select('id').from(db.tags.table).where('tag', tag).andWhere('itemId', id);
                })
                .limit(1)
            );
          }));
        });
    });
  }
    
  videos.publish = function(user, id, video) {
    video.published = true;
    return videos.edit(user, id, video);
  }

  videos.delete = function(user, id) {
    return db.knex(videos.table).where('id', id).modify(videos.authorizedManageSubquery, user).del();
  }

  videos.checkAuth = function(videoId, user) {
    return db.knex(videos.table).count('*').where('id', videoId).modify(videos.authorizedView, user);
  }

  videos.getVideo = function(user, videoId) {
    return db.knexnest(
      db.knex.select(`${videos.table}.id`, `${videos.table}.createdAt`, `${videos.table}.name`, `${videos.table}.description`, `${db.channels.table}.id as channel_id`, `${db.channels.table}.name as channel_name`, `${db.tags.table}.tag as tags__tag`)
      .select(knex.raw('COUNT(??) as ??', [`${db.videoViews.table}.channelId`, 'viewCount']))
      .select(knex.raw('COUNT(??) as ??', [`${db.videoLikes.table}.channelId`, 'likeCount']))
      .select(knex.raw('EXISTS(?) as ??', [
        db.knex.table(db.channelFollowers.table).select(1).where('followerId', user && user.id).andWhere('followeeId', `${db.channels.table}.id`).limit(1),
        'isFollowing',
      ])).select(knex.raw('EXISTS(?) as ??', [
        db.knex.table(db.videoLikes.table).select(1).where(`${db.videoLikes.table}.channelId`, user && user.id).andWhere(`${db.videoLikes.table}.videoId`, videoId).limit(1),
        'isLiking',
      ]))
      .from(videos.table)
      .leftJoin(db.channels.table, `${videos.table}.channelId`, `${db.channels.table}.id`)
      .leftJoin(db.tags.table, `${db.tags.table}.itemId`, `${videos.table}.id`)
      .leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
      .leftJoin(db.videoLikes.table, `${videos.table}.id`, `${db.videoLikes.table}.videoId`)
      .where(`${videos.table}.id`, videoId)
      .where(`${db.tags.table}.taggable`, 'VIDEO')
      .groupBy(`${videos.table}.id`, `${db.channels.table}.id`, `${db.tags.table}.tag`)
      .modify(videos.authorizedView, user, { channelsTable: 'c2' })
    );
  }

  videos.viewVideo = function(user, id) {
    return db.knex(db.knex.raw('?? (??, ??)', [db.videoViews.table, 'videoId', 'channelId'])).insert(
      db.knex.select(db.knex.raw('?, ?', [id, user && user.id])).from(videos.table)
        .whereNotExists(function() {
          this.select('id').from(videos.table).leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
            .where('id', id).andWhere(`${db.videoViews.table}.createdAt`, '>', new Date(new Date() - 3 * 60 * 60 * 1000))
        })
        .limit(1)
        .modify(videos.authorizedView, user)
    );
  }

  videos.likeVideo = function(user, id) {
    return db.knex(db.knex.raw('?? (??, ??)', [db.videoLikes.table, 'videoId', 'channelId'])).insert(
      db.knex.select(db.knex.raw('?, ?', [id, user && user.id])).from(videos.table)
        .whereNotExists(function() {
          this.select('id').from(videos.table).leftJoin(db.videoLikes.table, `${videos.table}.id`, `${db.videoLikes.table}.videoId`)
            .where('id', id).andWhere(`${db.videoLikes.table}.createdAt`, '>', new Date(new Date() - 3 * 60 * 60 * 1000))
        })
        .limit(1)
        .modify(videos.authorizedView, user)
    );
  }

  videos.dislikeVideo = function(user, id) {
    return db.knex(db.videoLikes.table).where('videoId', id).andWhere('channelId', user && user.id).del();
  }

  videos.order = function(queryBuilder, sort) {
    switch(sort) {
      case 'new':
        return queryBuilder.orderBy(`${videos.table}.createdAt`, 'desc');
      case 'trending':
        // TODO
      // by views
      case 'top':
        // TODO
      case 'random':
      default:
        return queryBuilder.orderBy(db.knex.raw('random()'));
    }
  }

  videos.getVideos = function(user, limit, offset, sort) {
    return db.knexnest(
      db.knex.select(`${videos.table}.id`, `${videos.table}.createdAt`, `${videos.table}.name`, `${videos.table}.description`, `${db.channels.table}.id as channel_id`, `${db.channels.table}.name as channel_name`)
      .select(knex.raw('COUNT(??) as ??', [`${db.videoViews.table}.channelId`, 'viewCount']))
      .from(videos.table)
      .leftJoin(db.channels.table, `${videos.table}.channelId`, `${db.channels.table}.id`)
      .leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
      .limit(limit)
      .offset(offset)
      .groupBy(`${videos.table}.id`, `${db.channels.table}.id`)
      .modify(videos.order, sort)
      .modify(videos.authorizedView, user, { channelsName: 'c2' })
    );
  }

  videos.getComments = function(user, videoId, { page, before }) {
    var query = db.knex
      .select('id', 'comment', 'createdAt', `${db.channels.table}.id as channel_id`, `${db.channels.table}.name as channel_name`)
      .from(db.comments.table)
      .limit(20)
      .order(`${db.comments.table}.createdAt`, 'desc')
      .where('videoId', videoId)
      .modify(db.channels.authorizedView, user)
      .modify(videos.authorizedView, user);
    if (page) {
      query.offset(page * 20);
    }
    if (before) {
      query.andWhere(`${db.comments.table}.createdAt`, '<', before);
    }
    return knexnest(query);
  }

  videos.postComment = function(user, videoId, comment) {
    return db.knex(db.knex.raw('?? (??, ??, ??)', [db.comments.table, 'comment', 'videoId', 'channelId'])).insert(
      db.knex.select(db.knex.raw('?, ?, ?', [comment, videoId, user && user.id])).from(videos.table)
        .where(`${videos.table}.id`, id).modify(videos.authorizedView, user)
    );
  }

  return videos;
};

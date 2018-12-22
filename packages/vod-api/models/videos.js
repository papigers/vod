var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 12);

function VideoError(message, code) {
  this.message = message;
  this.code = code;
}
VideoError.prototype = new Error();

module.exports = function(db) {
  var videos = function Video() {
    if (!(this instanceof Video)) {
      return new Video();
    }
  };
  videos.table = 'videos';
  videos.attributes = {
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
    var groups = (user && user.groups) || [];
    var tableName = options.table || videos.table;
    var channelsName = options.channelsTable || db.channels.table;
    var channelAclName = options.channelsTable
      ? `${db.channelAcls.table}_${options.channelsTable}`
      : db.channelAcls.table;

    return queryBuilder
      .leftJoin(
        `${db.channels.table} as ${channelsName}`,
        `${tableName}.channelId`,
        `${channelsName}.id`,
      )
      .leftJoin(
        `${db.channelAcls.table} as ${channelAclName}`,
        `${channelsName}.id`,
        `${channelAclName}.channelId`,
      )
      .where(function() {
        this.where(`${channelsName}.id`, userId).orWhere(function() {
          this.where(`${channelAclName}.access`, 'MANAGE').andWhere(function() {
            this.where(function() {
              this.where(`${channelAclName}.id`, userId).andWhere(`${channelAclName}.type`, 'USER');
            }).orWhere(function() {
              this.whereIn(`${channelAclName}.id`, groups).andWhere(
                `${channelAclName}.type`,
                'AD_GROUP',
              );
            });
          });
        });
      });
  };

  videos.authorizedManageSubquery = function(queryBuilder, user, options = {}) {
    var tableName = options.table || videos.table;
    return queryBuilder.whereIn(`${tableName}.id`, function() {
      this.select(`${videos.table}.id`)
        .from(videos.table)
        .modify(videos.authorizedManage, user, options);
    });
  };

  videos.authorizedView = function(queryBuilder, user, options = {}) {
    var userId = user && user.id;
    var groups = (user && user.groups) || [];
    var tableName = options.table || videos.table;
    var channelsName = options.channelsTable || db.channels.table;
    var aclName = options.table ? `${db.videoAcls.table}_${options.table}` : db.videoAcls.table;
    var channelAclName = options.channelsTable
      ? `${db.channelAcls.table}_${options.channelsName}`
      : db.channelAcls.table;

    return queryBuilder
      .leftJoin(`${db.videoAcls.table} as ${aclName}`, `${tableName}.id`, `${aclName}.videoId`)
      .leftJoin(
        `${db.channels.table} as ${channelsName}`,
        `${tableName}.channelId`,
        `${channelsName}.id`,
      )
      .leftJoin(
        `${db.channelAcls.table} as ${channelAclName}`,
        `${channelsName}.id`,
        `${channelAclName}.channelId`,
      )
      .where(function() {
        this.where(`${channelsName}.id`, userId)
          .orWhere(`${tableName}.privacy`, 'PUBLIC')
          .orWhere(function() {
            this.where(`${tableName}.privacy`, '<>', 'PUBLIC').andWhere(function() {
              this.where(function() {
                this.where(`${aclName}.id`, userId).andWhere(`${aclName}.type`, 'USER');
              }).orWhere(function() {
                this.whereIn(`${aclName}.id`, groups).andWhere(`${aclName}.type`, 'AD_GROUP');
              });
            });
          })
          .orWhere(function() {
            this.where(`${tableName}.privacy`, 'CHANNEL').andWhere(function() {
              this.where(function() {
                this.where(`${channelAclName}.id`, userId).andWhere(
                  `${channelAclName}.type`,
                  'USER',
                );
              }).orWhere(function() {
                this.whereIn(`${channelAclName}.id`, groups).andWhere(
                  `${channelAclName}.type`,
                  'AD_GROUP',
                );
              });
            });
          });
      });
  };

  videos.authorizedViewSubquery = function(queryBuilder, user, options = {}) {
    var tableName = options.table || videos.table;
    return queryBuilder.whereIn(`${tableName}.id`, function() {
      this.select(`${videos.table}.id`)
        .from(videos.table)
        .modify(videos.authorizedView, user, options);
    });
  };

  videos.videoListSelect = function(queryBuilder) {
    return queryBuilder
      .select(
        `${videos.table}.id as _id`,
        `${videos.table}.createdAt as _createdAt`,
        `${videos.table}.name as _name`,
        `${videos.table}.description as _description`,
        `${db.channels.table}.id as _channel_id`,
        `${db.channels.table}.name as _channel_name`,
      )
      .count(`${db.videoViews.table}.channelId as _viewCount`)
      .countDistinct(`${db.videoLikes.table}.channelId as _likeCount`)
      .from(videos.table)
      .leftJoin(db.channels.table, `${videos.table}.channelId`, `${db.channels.table}.id`)
      .leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
      .leftJoin(db.videoLikes.table, `${videos.table}.id`, `${db.videoLikes.table}.videoId`)
      .whereNotIn(`${videos.table}.id`, function() {
        this.select('id').from(db.uploads.table);
      })
      .where(`${videos.table}.state`, 'PUBLISHED');
  };

  videos.initialCreate = function(user, video) {
    var videoId = generateId();
    return db.knex.transaction(function(trx) {
      return trx
        .select(`${videos.table}.id`, `${videos.table}.name`, `${db.uploads.table}.step`)
        .from(videos.table)
        .innerJoin(db.uploads.table, `${videos.table}.id`, `${db.uploads.table}.id`)
        .where(`${videos.table}.name`, video.name)
        .andWhere(`${videos.table}.creatorId`, video.creator)
        .then(function(res) {
          if (res.length === 0) {
            return trx(videos.table)
              .insert({
                id: videoId,
                name: video.name,
                channelId: video.channel,
                creatorId: video.creator,
              })
              .then(function() {
                return trx(db.uploads.table).insert({
                  id: videoId,
                });
              })
              .then(function() {
                return db.knexnest(
                  trx
                    .select(
                      `${videos.table}.id`,
                      `${videos.table}.name`,
                      `${db.uploads.table}.step`,
                    )
                    .from(videos.table)
                    .innerJoin(db.uploads.table, `${videos.table}.id`, `${db.uploads.table}.id`)
                    .where(`${videos.table}.name`, video.name)
                    .andWhere(`${videos.table}.creatorId`, video.creator)
                    .limit(1),
                );
              });
          }
          return res[0];
        });
    });
  };

  videos.editProperty = function(user, property, items) {
    return db.knex.transaction(function(trx) {
      return Promise.all(
        items.map(function(video) {
          return trx(videos.table)
            .where('id', video.id)
            .update({
              [property]: video.property,
            })
            .modify(videos.authorizedManageSubquery, user)
            .transacting(trx);
        }),
      ).catch(function(err) {
        return trx.rollback(new VideoError(err, 500));
      });
    });
  };

  videos.editVideosPrivacy = function(user, items) {
    return db.knex.transaction(function(trx) {
      Promise.all(
        items.map(function(video) {
          return trx(videos.table)
            .update({
              privacy: video.privacy,
            })
            .where('id', video.id)
            .modify(videos.authorizedManageSubquery, user)
            .then(function(updated) {
              if (!!updated) {
                return trx(db.videoAcls.table)
                  .where(`${db.videoAcls.table}.videoId`, video.id)
                  .whereIn(`${db.videoAcls.table}.videoId`, function() {
                    this.select(`${videos.table}.id`)
                      .from(videos.table)
                      .where(`${videos.table}.id`, video.id)
                      .modify(videos.authorizedManageSubquery, user);
                  })
                  .del();
              }
              throw new VideoError('Video not found or unathorized', 403);
            })
            .then(function() {
              if (video.privacy !== 'PUBLIC') {
                return Promise.all(
                  video.acls.map(function(acl) {
                    return trx(db.videoAcls.table).insert({
                      videoId: video.id,
                      id: acl.id,
                      type: acl.type,
                    });
                  }),
                );
              }
              return Promise.resolve(video);
            });
        }),
      )
        .then(trx.commit)
        .catch(trx.rollback);
    });
  };

  videos.editPrivacy = function(user, id, video) {
    return db
      .knex(videos.table)
      .where('id', id)
      .limit(1)
      .modify(videos.authorizedManageSubquery, user)
      .then(function(videos) {
        if (videos && videos.length) {
          return db.knex.transaction(function(trx) {
            return trx(videos.table)
              .update({
                privacy: video.privacy,
              })
              .where('id', video.id)
              .then(function() {
                return trx(db.videoAcls.table)
                  .where('videoId', id)
                  .del();
              })
              .then(function() {
                if (video.privacy !== 'PUBLIC') {
                  return Promise.all(
                    video.acls.map(function(acl) {
                      return trx(db.videoAcls.table).insert({
                        videoId: id,
                        id: acl.id,
                        type: acl.type,
                      });
                    }),
                  );
                }
                return Promise.resolve(video);
              })
              .catch(function(err) {
                return trx.rollback(new VideoError(err, 500));
              });
          });
        }
        throw new VideoError('Video not found or not authorized', 403);
      });
  };

  videos.editTags = function(user, action, items) {
    var { videosId, tags } = items;
    return db
      .knex(videos.table)
      .whereIn('id', videosId)
      .modify(videos.authorizedManageSubquery, user)
      .then(function(managedVideos) {
        if (managedVideos.length === videosId.length) {
          return db.knex.transaction(function(trx) {
            switch (action) {
              case 'clean':
                return trx(db.tags.table)
                  .whereIn(`${db.tags.table}.itemId`, videosId)
                  .del();
              case 'replace':
                return Promise.all(
                  videosId.map(function(videoId) {
                    return Promise.all(
                      tags.map(function(tag) {
                        return trx(
                          trx.raw('?? (??, ??, ??)', [db.tags.table, 'tag', 'taggable', 'itemId']),
                        ).insert(
                          trx
                            .select(trx.raw('?, ?, ?', [tag, 'VIDEO', videoId]))
                            .whereNotExists(function() {
                              this.select('tag')
                                .from(db.tags.table)
                                .where('tag', tag)
                                .andWhere('itemId', videoId)
                                .andWhere('taggable', 'VIDEO');
                            })
                            .limit(1),
                        );
                      }),
                    ).then(function() {
                      return trx(db.tags.table)
                        .where('itemId', videoId)
                        .whereNotIn('tag', tags)
                        .del();
                    });
                  }),
                );
              case 'remove':
                return trx(db.tags.table)
                  .whereIn(`${db.tags.table}.itemId`, videosId)
                  .whereIn('tag', tags)
                  .del();
              case 'add':
              default:
                return Promise.all(
                  videosId.map(function(videoId) {
                    return Promise.all(
                      tags.map(function(tag) {
                        return trx(
                          trx.raw('?? (??, ??, ??)', [db.tags.table, 'tag', 'taggable', 'itemId']),
                        ).insert(
                          trx
                            .select(trx.raw('?, ?, ?', [tag, 'VIDEO', videoId]))
                            .whereNotExists(function() {
                              this.select('tag')
                                .from(db.tags.table)
                                .where('tag', tag)
                                .andWhere('itemId', videoId)
                                .andWhere('taggable', 'VIDEO');
                            }),
                        );
                      }),
                    );
                  }),
                );
            }
          });
        }
        throw new VideoError('Videos not found or not authorized', 403);
      });
  };

  videos.edit = function(user, id, video) {
    video.tags = video.tags || [];
    video.acls = video.acls || [];
    return db.knex.transaction(function(trx) {
      return Promise.all(
        video.tags.map(function(tag) {
          return trx(
            trx.raw('?? (??, ??, ??)', [db.tags.table, 'tag', 'taggable', 'itemId']),
          ).insert(
            trx
              .select(trx.raw('?, ?, ?', [tag, 'VIDEO', id]))
              .whereNotExists(function() {
                this.select('tag')
                  .from(db.tags.table)
                  .where('tag', tag)
                  .andWhere('itemId', id)
                  .andWhere('taggable', 'VIDEO');
              })
              .limit(1),
          );
        }),
      )
        .then(function(res) {
          return trx(db.videoAcls.table)
            .where('videoId', id)
            .del();
        })
        .then(function() {
          if (video.privacy !== 'PUBLIC') {
            return Promise.all(
              video.acls.map(function(acl) {
                return trx(db.videoAcls.table).insert({
                  videoId: id,
                  id: acl.id,
                  type: acl.type,
                });
              }),
            );
          }
          return Promise.resolve(video);
        })
        .then(function() {
          return trx(db.tags.table)
            .where('itemId', id)
            .whereNotIn('tag', video.tags)
            .del();
        })
        .then(function() {
          return trx(videos.table)
            .update({
              name: video.name,
              description: video.description,
              privacy: video.privacy,
              channelId: video.channel && video.channel.id,
              state: video.state,
            })
            .where('id', id)
            .modify(videos.authorizedManageSubquery, user);
        })
        .then(function(updated) {
          if (!updated) {
            return trx.rollback(new VideoError('Video not found or unauthorized', 404));
          }
          return updated;
        });
    });
  };

  videos.delete = function(user, id) {
    return db
      .knex(videos.table)
      .where('id', id)
      .modify(videos.authorizedManageSubquery, user)
      .del();
  };

  videos.checkAuth = function(videoId, user) {
    return db.knexnest(
      db
        .knex(videos.table)
        .count('*')
        .where(`${videos.table}.id`, videoId)
        .modify(videos.authorizedViewSubquery, user),
    );
  };

  videos.checkManageAuth = function(videoId, user) {
    return db.knexnest(
      db
        .knex(videos.table)
        .count('*')
        .where(`${videos.table}.id`, videoId)
        .modify(videos.authorizedManageSubquery, user),
    );
  };

  videos.getVideo = function(user, videoId) {
    return db.knexnest(
      db.knex
        .select(
          `${videos.table}.id`,
          `${videos.table}.createdAt`,
          `${videos.table}.name`,
          `${videos.table}.description`,
          `${db.channels.table}.id as channel_id`,
          `${db.channels.table}.name as channel_name`,
          `${db.tags.table}.tag as tags__tag`,
        )
        .count(`${db.videoViews.table}.channelId as viewCount`)
        .countDistinct(`${db.videoLikes.table}.channelId as likeCount`)
        .select(
          db.knex.raw('EXISTS(?) as ??', [
            db.knex
              .table(db.channelFollowers.table)
              .select(1)
              .where('followerId', user && user.id)
              .andWhere('followeeId', db.knex.raw('??', `${db.channels.table}.id`))
              .limit(1),
            'channel_isFollowing',
          ]),
        )
        .select(
          db.knex.raw('EXISTS(?) as ??', [
            db.knex
              .table(db.videoLikes.table)
              .select(1)
              .where(`${db.videoLikes.table}.channelId`, user && user.id)
              .andWhere(`${db.videoLikes.table}.videoId`, videoId)
              .limit(1),
            'userLikes',
          ]),
        )
        .from(videos.table)
        .leftJoin(db.channels.table, `${videos.table}.channelId`, `${db.channels.table}.id`)
        .leftJoin(db.tags.table, function() {
          this.on(`${db.tags.table}.itemId`, `${videos.table}.id`).on(
            `${db.tags.table}.taggable`,
            db.knex.raw('?', ['VIDEO']),
          );
        })
        .leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
        .leftJoin(db.videoLikes.table, `${videos.table}.id`, `${db.videoLikes.table}.videoId`)
        .where(`${videos.table}.id`, videoId)
        .where(`${videos.table}.state`, '<>', 'DRAFT')
        .groupBy(`${videos.table}.id`, `${db.channels.table}.id`, `${db.tags.table}.tag`)
        .modify(videos.authorizedViewSubquery, user),
    );
  };

  videos.viewVideo = function(user, id) {
    return db
      .knex(db.knex.raw('?? (??, ??)', [db.videoViews.table, 'videoId', 'channelId']))
      .insert(
        db.knex
          .select(db.knex.raw('?, ?', [id, user && user.id]))
          .from(videos.table)
          .whereNotExists(function() {
            this.select('id')
              .from(videos.table)
              .leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
              .where('id', id)
              .andWhere(
                `${db.videoViews.table}.createdAt`,
                '>',
                new Date(new Date() - 3 * 60 * 60 * 1000),
              );
          })
          .limit(1)
          .modify(videos.authorizedView, user),
      );
  };

  videos.likeVideo = function(user, id) {
    return db.knex.transaction(function(trx) {
      return db
        .knex(db.knex.raw('?? (??, ??)', [db.videoLikes.table, 'videoId', 'channelId']))
        .transacting(trx)
        .insert(
          db.knex
            .select(db.knex.raw('?, ?', [id, user && user.id]))
            .from(videos.table)
            .whereNotExists(function() {
              this.select('id')
                .from(videos.table)
                .leftJoin(
                  db.videoLikes.table,
                  `${videos.table}.id`,
                  `${db.videoLikes.table}.videoId`,
                )
                .where('id', id)
                .andWhere(
                  `${db.videoLikes.table}.createdAt`,
                  '>',
                  new Date(new Date() - 3 * 60 * 60 * 1000),
                );
            })
            .limit(1)
            .modify(videos.authorizedView, user),
        )
        .then(function() {
          return db.notifications.addVideoLikeNotification(user, id, trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  };

  videos.dislikeVideo = function(user, id) {
    return db.knex.transaction(function(trx) {
      return db
        .knex(db.videoLikes.table)
        .transacting(trx)
        .where('videoId', id)
        .andWhere('channelId', user && user.id)
        .del()
        .then(function() {
          return db.notifications.removeVideoLikeNotification(user, id, trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  };

  videos.order = function(queryBuilder, sort) {
    switch (sort) {
      case 'relevance':
        return queryBuilder.orderBy('search.rank', 'desc');
      case 'new':
        return queryBuilder.orderBy(`${videos.table}.createdAt`, 'desc');
      case 'leastTrending':
      case 'trending':
        var now = new Date();
        var monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return queryBuilder
          .orderByRaw(
            `((count(??) filter (where ?? >= ?)) + (2.5 * (count(distinct ??) filter (where ?? >= ?)))) ${
              sort === 'trending' ? 'desc' : 'asc'
            }`,
            [
              `${db.videoViews.table}.channelId`,
              `${db.videoViews.table}.createdAt`,
              monthAgo,
              `${db.videoLikes.table}.channelId`,
              `${db.videoLikes.table}.createdAt`,
              monthAgo,
            ],
          )
          .modify(videos.order, sort === 'trending' ? 'top' : 'top');
      // by views
      case 'bottom':
      case 'top':
        return queryBuilder.orderByRaw(
          `(count(??) + (2.5 * count(distinct ??))) ${sort === 'top' ? 'desc' : 'asc'}`,
          [`${db.videoViews.table}.channelId`, `${db.videoLikes.table}.channelId`],
        );
      case 'random':
      default:
        return queryBuilder.orderBy(db.knex.raw('random()'));
    }
  };

  videos.getVideos = function(user, limit, offset, sort) {
    return db.knexnest(
      db.knex
        .queryBuilder()
        .modify(videos.videoListSelect)
        .limit(limit)
        .offset(offset)
        .groupBy(`${videos.table}.id`, `${db.channels.table}.id`)
        .modify(videos.order, sort)
        .modify(videos.authorizedViewSubquery, user, { channelsName: 'c2' }),
      true,
    );
  };

  videos.getManagedVideos = function(user) {
    return db.knexnest(
      db.knex
        .select(
          `${videos.table}.id as _id`,
          `${videos.table}.createdAt as _createdAt`,
          `${videos.table}.name as _name`,
          `${videos.table}.description as _description`,
          `${db.tags.table}.tag as _tags__tag`,
          `${videos.table}.state as _state`,
          `${videos.table}.privacy as _privacy`,
          `${db.channels.table}.id as _channel_id`,
          `${db.channels.table}.name as _channel_name`,
          `${db.channels.table}.personal as _channel_personal`,
          `${db.videoAcls.table}.id as _acls__id`,
          `${db.videoAcls.table}.type as _acls__type`,
          `${db.videoAcls.table}.videoId as _acls__videoId`,
        )
        .select(db.knex.raw('COUNT(??) as ??', [`${db.videoViews.table}.channelId`, '_viewsCount']))
        .select(
          db.knex.raw('COUNT(DISTINCT ?? ) as ??', [
            `${db.videoLikes.table}.channelId`,
            '_likesCount',
          ]),
        )
        .select(db.knex.raw('COUNT(??) as ??', [`${db.comments.table}.id`, '_commentsCount']))
        .from(videos.table)
        .leftJoin(db.channels.table, `${videos.table}.channelId`, `${db.channels.table}.id`)
        .leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
        .leftJoin(db.videoLikes.table, `${videos.table}.id`, `${db.videoLikes.table}.videoId`)
        .leftJoin(db.comments.table, `${videos.table}.id`, `${db.comments.table}.videoId`)
        .leftJoin(db.videoAcls.table, `${videos.table}.id`, `${db.videoAcls.table}.videoId`)
        .leftJoin(db.tags.table, `${videos.table}.id`, `${db.tags.table}.itemId`)
        .groupBy(
          `${videos.table}.id`,
          `${db.channels.table}.id`,
          `${db.videoAcls.table}.id`,
          `${db.videoAcls.table}.videoId`,
          `${db.tags.table}.itemId`,
          `${db.tags.table}.tag`,
        )
        .orderBy('_channel_personal', 'desc')
        .orderBy('_channel_id')
        .orderBy('_createdAt', 'desc')
        .modify(videos.authorizedManageSubquery, user),
      true,
    );
  };

  videos.searchVideos = function(user, query) {
    return this.modify(videos.videoListSelect)
      .select(db.knex.raw('search.rank as _rank'))
      .select(db.knex.raw('NULL as ??', ['_isFollowing']))
      .select(db.knex.raw('? as ??', ['video', '_type']))
      .innerJoin(
        db
          .knex(`${videos.table}`)
          .select(
            db.knex.raw(
              `ts_rank(?? || setweight(??, 'D'), to_tsquery('english', ''' ' || ? || ' ''')) as rank`,
              [`${videos.table}.tsv`, `${db.channels.table}.tsv`, query],
            ),
          )
          .select(`${videos.table}.id as search_id`)
          .leftJoin(db.channels.table, `${videos.table}.channelId`, `${db.channels.table}.id`)
          .where(
            `${videos.table}.tsv`,
            '@@',
            db.knex.raw(`to_tsquery('english', ''' ' || ? || ' ''')`, [query]),
          )
          .orWhere(
            `${db.channels.table}.tsv`,
            '@@',
            db.knex.raw(`to_tsquery('english', ''' ' || ? || ' ''')`, [query]),
          )
          .as('search'),
        `${videos.table}.id`,
        'search.search_id',
      )
      .groupBy(`${videos.table}.id`, `${db.channels.table}.id`, 'search.rank')
      .modify(videos.order, 'relevance')
      .modify(videos.authorizedViewSubquery, user, { channelsName: 'c2' });
  };
  videos.search = videos.searchVideos.bind(db.knex.queryBuilder());

  videos.getUserTrendingVideos = function(queryBuilder, user) {
    return queryBuilder
      .select(`${videos.table}.*`)
      .from(videos.table)
      .leftJoin(db.videoViews.table, function() {
        this.on(`${db.videoViews.table}.videoId`, `${videos.table}.id`).on(
          `${db.videoViews.table}.channelId`,
          db.knex.raw('?', [user && user.id]),
        );
      })
      .leftJoin(db.videoLikes.table, function() {
        this.on(`${db.videoLikes.table}.videoId`, `${videos.table}.id`).on(
          `${db.videoLikes.table}.channelId`,
          db.knex.raw('?', [user && user.id]),
        );
      })
      .groupBy(`${videos.table}.id`)
      .modify(videos.order, 'trending');
  };

  videos.getRelatedVideos = function(user, limit, offset, videoId) {
    return db.knexnest(
      db.knex
        .with('queriedVideo', function(queryBuilder) {
          return queryBuilder
            .select(`${videos.table}.*`)
            .from(videos.table)
            .where(`${videos.table}.id`, videoId);
        })
        .with('queriedWatchers', function(queryBuilder) {
          return queryBuilder
            .select(`${db.videoViews.table}.channelId`)
            .from(db.videoViews.table)
            .leftJoin('queriedVideo', 'queriedVideo.channelId', `${db.videoViews.table}.channelId`)
            .leftJoin(db.videoLikes.table, function() {
              this.on('queriedVideo.id', `${db.videoLikes.table}.videoId`).on(
                `${db.videoViews.table}.channelId`,
                `${db.videoLikes.table}.channelId`,
              );
            })
            .groupBy(`${db.videoViews.table}.channelId`)
            .orderByRaw('((count(??)) + (2 * (count (distinct ??)))) desc', [
              `${db.videoViews.table}.channelId`,
              `${db.videoLikes.table}.channelId`,
            ]);
        })
        .with('queriedVideoQuery', function(queryBuilder) {
          return queryBuilder
            .select(db.knex.raw('?? || ? || ?? as ??', ['name', ' ', 'description', 'query']))
            .from('queriedVideo');
        })
        .select()
        .from(function() {
          this.union(
            // trending videos from the channel of the video
            function() {
              this.modify(videos.videoListSelect)
                .groupBy(`${videos.table}.id`, `${db.channels.table}.id`)
                .whereIn(`${videos.table}.channelId`, function() {
                  this.select('channelId').from('queriedVideo');
                })
                .modify(videos.order, 'trending')
                .modify(videos.authorizedViewSubquery, user);
            },
            // top videos viewd by users who viewd queried video
            function() {
              this.modify(videos.videoListSelect)
                .whereIn(`${videos.table}.id`, function() {
                  this.select(`${db.videoViews.table}.videoId as id`)
                    .from(db.videoViews.table)
                    .whereIn(
                      `${db.videoViews.table}.channelId`,
                      db.knex.raw('select ?? from ??', ['channelId', 'queriedWatchers']),
                    );
                })
                .groupBy(`${videos.table}.id`, `${db.channels.table}.id`)
                .modify(videos.order, 'top')
                .modify(videos.authorizedViewSubquery, user);
            },
            // trending videos resulted from queried video search query
            function() {
              this.modify(videos.videoListSelect)
                .innerJoin(
                  db
                    .knex(`${videos.table}`)
                    .select(
                      db.knex.raw(
                        `ts_rank(?? || setweight(??, 'D'), to_tsquery('english', ''' ' || (select ?? from ??) || ' ''')) as rank`,
                        [
                          `${videos.table}.tsv`,
                          `${db.channels.table}.tsv`,
                          'query',
                          'queriedVideoQuery',
                        ],
                      ),
                    )
                    .select(`${videos.table}.id as search_id`)
                    .leftJoin(
                      db.channels.table,
                      `${videos.table}.channelId`,
                      `${db.channels.table}.id`,
                    )
                    .where(
                      `${videos.table}.tsv`,
                      '@@',
                      db.knex.raw(`to_tsquery('english', ''' ' || (select ?? from ??) || ' ''')`, [
                        'query',
                        'queriedVideoQuery',
                      ]),
                    )
                    .orWhere(
                      `${db.channels.table}.tsv`,
                      '@@',
                      db.knex.raw(`to_tsquery('english', ''' ' || (select ?? from ??) || ' ''')`, [
                        'query',
                        'queriedVideoQuery',
                      ]),
                    )
                    .as('search'),
                  `${videos.table}.id`,
                  'search.search_id',
                )
                .groupBy(`${videos.table}.id`, `${db.channels.table}.id`, 'search.rank')
                .modify(videos.order, 'relevance')
                .modify(videos.order, 'trending')
                .modify(videos.authorizedViewSubquery, user);
            },
            true,
          ).as('videos');
        })
        .where('videos._id', '<>', videoId)
        .limit(limit)
        .offset(offset),
      true,
    );
  };

  videos.getRecommendedVideos = function(user, limit, offset) {
    return db.knexnest(
      db.knex
        .with('trendingVideos', function(queryBuilder) {
          return queryBuilder.modify(videos.getUserTrendingVideos, user);
        })
        .with('trendingWatchers', function(queryBuilder) {
          return queryBuilder
            .select(`${db.videoViews.table}.channelId`)
            .from(db.videoViews.table)
            .leftJoin(
              'trendingVideos',
              'trendingVideos.channelId',
              `${db.videoViews.table}.channelId`,
            )
            .leftJoin(db.videoLikes.table, function() {
              this.on('trendingVideos.id', `${db.videoLikes.table}.videoId`).on(
                `${db.videoViews.table}.channelId`,
                `${db.videoLikes.table}.channelId`,
              );
            })
            .groupBy(`${db.videoViews.table}.channelId`)
            .orderByRaw('((count(??)) + (2 * (count (distinct ??)))) desc', [
              `${db.videoViews.table}.channelId`,
              `${db.videoLikes.table}.channelId`,
            ]);
        })
        .with('trendingNames', function(queryBuilder) {
          return queryBuilder
            .select(db.knex.raw('string_agg(??, ?) as ??', ['name', ' ', 'names']))
            .from('trendingVideos');
        })
        .select()
        .from(function() {
          this.union(
            // less trending videos from the channels of user's trending videos
            function() {
              this.modify(videos.videoListSelect)
                .groupBy(`${videos.table}.id`, `${db.channels.table}.id`)
                .whereIn(`${videos.table}.channelId`, function() {
                  this.select('channelId').from('trendingVideos');
                })
                .modify(videos.order, 'leastTrending')
                .modify(videos.authorizedViewSubquery, user);
            },
            // top videos viewd by users who viewd your trending videos
            function() {
              this.modify(videos.videoListSelect)
                .whereIn(`${videos.table}.id`, function() {
                  this.select(`${db.videoViews.table}.videoId`)
                    .from(db.videoViews.table)
                    .whereIn(
                      `${db.videoViews.table}.channelId`,
                      db.knex.raw('select ?? from ??', ['channelId', 'trendingWatchers']),
                    );
                })
                .groupBy(`${videos.table}.id`, `${db.channels.table}.id`)
                .modify(videos.order, 'top')
                .modify(videos.authorizedViewSubquery, user);
            },
            // trending videos resulted from trending videos names search query
            function() {
              this.modify(videos.videoListSelect)
                .innerJoin(
                  db
                    .knex(`${videos.table}`)
                    .select(
                      db.knex.raw(
                        `ts_rank(?? || setweight(??, 'D'), to_tsquery('english', ''' ' || (select ?? from ??) || ' ''')) as rank`,
                        [
                          `${videos.table}.tsv`,
                          `${db.channels.table}.tsv`,
                          'names',
                          'trendingNames',
                        ],
                      ),
                    )
                    .select(`${videos.table}.id as search_id`)
                    .leftJoin(
                      db.channels.table,
                      `${videos.table}.channelId`,
                      `${db.channels.table}.id`,
                    )
                    .where(
                      `${videos.table}.tsv`,
                      '@@',
                      db.knex.raw(`to_tsquery('english', ''' ' || (select ?? from ??) || ' ''')`, [
                        'names',
                        'trendingNames',
                      ]),
                    )
                    .orWhere(
                      `${db.channels.table}.tsv`,
                      '@@',
                      db.knex.raw(`to_tsquery('english', ''' ' || (select ?? from ??) || ' ''')`, [
                        'names',
                        'trendingNames',
                      ]),
                    )
                    .as('search'),
                  `${videos.table}.id`,
                  'search.search_id',
                )
                .groupBy(`${videos.table}.id`, `${db.channels.table}.id`, 'search.rank')
                .modify(videos.order, 'relevance')
                .modify(videos.order, 'trending')
                .modify(videos.authorizedViewSubquery, user);
            },
            true,
          ).as('videos');
        })
        .limit(limit)
        .offset(offset)
        .orderByRaw('(?? + (2.5 * ??)) desc', ['_viewCount', '_likeCount']),
      true,
    );
  };

  videos.setMetadata = function(videoId, metadata) {
    return db
      .knex(videos.table)
      .update({
        metadata_height: metadata.height,
        metadata_width: metadata.width,
        metadata_resolution: metadata.resolution,
        metadata_duration: metadata.duration,
        metadata_size: metadata.size,
      })
      .where('id', videoId);
    // return db.knex.transaction(function(trx) {
    //   return trx(videos.table)
    //   .update({
    //     metadata_height: metadata.height,
    //     metadata_width: metadata.width,
    //     metadata_resolution: metadata.resolution,
    //     metadata_duration: metadata.duration,
    //     metadata_size: metadata.size,
    //   })
    //   .where('id', videoId)
    //   .then(function(updated) {
    //     if (!updated) {
    //       throw new VideoError(
    //         'Video not found',
    //         404,
    //       );
    //     }
    //     if (!metadata.resolution) {
    //       return Promise.resolve(updated);
    //     }
    //     var required = 3;
    //     if (metadata.resolution >= 1080) {
    //       required = 7; // 1080 720 480 360 240 audio mpd
    //     }
    //     else if (metadata.resolution  >= 720) {
    //       required = 6;
    //     }
    //     else if (metadata.resolution  >= 480) {
    //       required = 5;
    //     }
    //     else if (metadata.resolution  >= 360) {
    //       required = 4;
    //     }
    //     return trx(db.uploads.table)
    //     .update('required', required)
    //     .where('id', videoId);
    //   });
    // });
  };

  videos.getManagedVideos = function(user, videoId) {
    var query = db.knex
      .select(
        `${videos.table}.id as _id`,
        `${videos.table}.createdAt as _createdAt`,
        `${videos.table}.name as _name`,
        `${videos.table}.description as _description`,
        `${videos.table}.state as _state`,
        `${videos.table}.metadata_height as _metadata_height`,
        `${videos.table}.metadata_width as _metadata_width`,
        `${videos.table}.metadata_resolution as _metadata_resolution`,
        `${videos.table}.metadata_duration as _metadata_duration`,
        `${videos.table}.metadata_size as _metadata_size`,
        `${db.tags.table}.tag as _tags__tag`,
        `${videos.table}.privacy as _privacy`,
        `${db.channels.table}.id as _channel_id`,
        `${db.channels.table}.name as _channel_name`,
        `${db.channels.table}.personal as _channel_personal`,
        `${db.videoAcls.table}.id as _acls__id`,
        `${db.videoAcls.table}.type as _acls__type`,
        `${db.uploads.table}.id as _upload_id`,
        `${db.uploads.table}.required as _upload_requiredFiles`,
        `${db.uploads.table}.uploaded as _upload_uploadedFiles`,
        `${db.uploads.table}.step as _upload_step`,
      )
      .count(`${db.videoViews.table}.channelId as _viewsCount`)
      .countDistinct(`${db.videoLikes.table}.channelId as _likesCount`)
      .count(`${db.comments.table}.id as _commentsCount`)
      .from(videos.table)
      .leftJoin(db.channels.table, `${videos.table}.channelId`, `${db.channels.table}.id`)
      .leftJoin(db.videoViews.table, `${videos.table}.id`, `${db.videoViews.table}.videoId`)
      .leftJoin(db.videoLikes.table, `${videos.table}.id`, `${db.videoLikes.table}.videoId`)
      .leftJoin(db.comments.table, `${videos.table}.id`, `${db.comments.table}.videoId`)
      .leftJoin(db.videoAcls.table, `${videos.table}.id`, `${db.videoAcls.table}.videoId`)
      .leftJoin(db.tags.table, `${videos.table}.id`, `${db.tags.table}.itemId`)
      .leftJoin(db.uploads.table, `${videos.table}.id`, `${db.uploads.table}.id`)
      .groupBy(
        `${videos.table}.id`,
        `${db.channels.table}.id`,
        `${db.videoAcls.table}.id`,
        `${db.videoAcls.table}.videoId`,
        `${db.tags.table}.itemId`,
        `${db.tags.table}.tag`,
        `${db.uploads.table}.id`,
      )
      .orderBy('_channel_personal', 'desc')
      .orderBy('_channel_id')
      .orderBy('_createdAt', 'desc')
      .modify(videos.authorizedManageSubquery, user);
    if (!!videoId) {
      query = query.where(`${videos.table}.id`, videoId);
    }
    return db.knexnest(query, true);
  };

  return videos;
};

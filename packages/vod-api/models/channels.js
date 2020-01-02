module.exports = function(db) {
  var channels = function Channel() {
    if (!(this instanceof Channel)) {
      return new Channel();
    }
  };

  channels.table = 'channels';
  channels.attributes = {
    id: {
      type: 'string',
      primaryKey: true,
      notNullable: true,
    },
    personal: {
      type: 'boolean',
      default: false,
      notNullable: true,
    },
    privacy: {
      type: 'enu',
      values: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC',
      notNullable: true,
    },
    name: {
      type: 'string',
      unique: true,
      notNullable: true,
    },
    description: {
      type: 'string',
    },
  };
  channels.createdAt = true;
  channels.updatedAt = true;

  channels.order = function(queryBuilder, sort) {
    switch (sort) {
      case 'relevance':
        return queryBuilder.orderBy('search.rank', 'desc');
      case 'new':
        return queryBuilder.orderBy(`${channels.table}.createdAt`, 'desc');
      case 'trending':
      // TODO
      // by views
      case 'top':
      // TODO
      case 'random':
      default:
        return queryBuilder.orderBy(db.knex.raw('random()'));
    }
  };

  channels.authorizedManage = function(queryBuilder, user, options = {}) {
    var userId = user && user.id;
    var groups = (user && user.groups) || [];
    var tableName = options.table || channels.table;
    var aclName = options.table ? `${db.channelAcls.table}_${options.table}` : db.channelAcls.table;

    return queryBuilder
      .leftJoin(`${db.channelAcls.table} as ${aclName}`, `${tableName}.id`, `${aclName}.channelId`)
      .where(function() {
        this.where(`${tableName}.id`, userId)
          .orWhere(function() {
            this.where(`${aclName}.id`, userId)
              .andWhere(`${aclName}.type`, 'USER')
              .andWhere(`${aclName}.access`, 'MANAGE');
          })
          .orWhere(function() {
            this.whereIn(`${aclName}.id`, groups)
              .andWhere(`${aclName}.type`, 'AD_GROUP')
              .andWhere(`${aclName}.access`, 'MANAGE');
          });
      });
  };

  channels.authorizedManageSubquery = function(queryBuilder, user, options = {}) {
    var tableName = options.table || channels.table;
    return queryBuilder.whereIn(`${tableName}.id`, function() {
      this.select(`${channels.table}.id`)
        .from(channels.table)
        .modify(channels.authorizedManage, user, options);
    });
  };

  channels.authorizedView = function(queryBuilder, user, options = {}) {
    var userId = user && user.id;
    var groups = (user && user.groups) || [];
    var tableName = options.table || channels.table;
    var aclName = options.table ? `${db.channelAcls.table}_${options.table}` : db.channelAcls.table;

    return queryBuilder
      .leftJoin(`${db.channelAcls.table} as ${aclName}`, `${tableName}.id`, `${aclName}.channelId`)
      .where(function() {
        this.where(`${tableName}.id`, userId)
          .orWhere(`${tableName}.privacy`, 'PUBLIC')
          .orWhere(function() {
            this.where(`${tableName}.privacy`, 'PRIVATE').andWhere(function() {
              this.where(function() {
                this.where(`${aclName}.id`, userId).andWhere(`${aclName}.type`, 'USER');
              }).orWhere(function() {
                this.whereIn(`${aclName}.id`, groups).andWhere(`${aclName}.type`, 'AD_GROUP');
              });
            });
          });
      });
  };

  channels.authorizedViewSubquery = function(queryBuilder, user, options = {}) {
    var tableName = options.table || channels.table;
    return queryBuilder.whereIn(`${tableName}.id`, function() {
      this.select(`${channels.table}.id`)
        .from(channels.table)
        .modify(channels.authorizedView, user, options);
    });
  };

  channels.getManagedChannels = function(user) {
    return db.knex
      .select(`${channels.table}.id`, `${channels.table}.name`)
      .from(channels.table)
      .where(`${channels.table}.verified`, true)
      .modify(channels.authorizedManageSubquery, user);
  };

  channels.getChannelVideos = function(user, channelId, limit, offset, sort, fields) {
    var query = db.knex
      .queryBuilder()
      .modify(db.videos.videoListSelect)
      .where(`${channels.table}.id`, channelId)
      .where(`${channels.table}.verified`, true)
      .limit(limit)
      .offset(offset)
      .groupBy(`${db.videos.table}.id`, `${channels.table}.id`)
      .modify(db.videos.order, sort)
      .modify(channels.authorizedViewSubquery, user)
      .modify(db.videos.authorizedViewSubquery, user);
    if (fields && fields.length) {
      query.clearSelect().select(...fields);
    }

    return db.knexnest(query, true);
  };

  channels.getChannel = function(user, id) {
    return db.knexnest(
      db.knex
        .select(
          `${channels.table}.id`,
          `${channels.table}.personal`,
          `${channels.table}.name`,
          `${channels.table}.description`,
        )
        .from(channels.table)
        .select(
          db.knex.raw('EXISTS(?) as ??', [
            db.knex
              .table(db.channelFollowers.table)
              .select(1)
              .where('followerId', user && user.id)
              .andWhere('followeeId', id)
              .limit(1),
            'isFollowing',
          ]),
        )
        .select(
          db.knex.raw('EXISTS(?) as ??', [
            db.knex
              .table(channels.table)
              .select(1)
              .where('id', id)
              .modify(channels.authorizedManageSubquery, user)
              .limit(1),
            'canManage',
          ]),
        )
        .where(`${channels.table}.id`, id)
        .where(`${channels.table}.verified`, true)
        .modify(channels.authorizedViewSubquery, user),
    );
  };

  channels.deleteChannel = function(user, channelId) {
    return db
      .knex(channels.table)
      .where('id', channelId)
      .modify(channels.authorizedManageSubquery, user)
      .del();
  };

  channels.deleteChannelAdmin = function(channelId) {
    return db
      .knex(channels.table)
      .where('id', channelId)
      .del();
  };

  channels.followChannel = function(user, id) {
    return db.knex.transaction(function(trx) {
      return db
        .knex(
          db.knex.raw('?? (??, ??)', [`${db.channelFollowers.table}`, 'followerId', 'followeeId']),
        )
        .transacting(trx)
        .insert(
          db.knex
            .select(db.knex.raw('?, ?', [user && user.id, id]))
            .from(channels.table)
            .where(`${channels.table}.id`, id)
            .modify(channels.authorizedViewSubquery, user),
        )
        .then(function() {
          return db.notifications.addChannelFollowNotification(user, id, trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  };

  channels.unfollowChannel = function(user, id) {
    return db.knex.transaction(function(trx) {
      return db
        .knex(db.channelFollowers.table)
        .transacting(trx)
        .where({
          followerId: user && user.id,
          followeeId: id,
        })
        .del()
        .then(function() {
          return db.notifications.removeChannelFollowNotification(user, id, trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  };

  channels.getFollowers = function(user, id) {
    return db.knex
      .select('c2.id', 'c2.name', 'c2.description')
      .from(`${channels.table} as c1`)
      .leftJoin(`${db.channelFollowers.table}`, `${db.channelFollowers.table}.followeeId`, 'c1.id')
      .leftJoin(`${channels.table} as c2`, `${db.channelFollowers.table}.followerId`, 'c2.id')
      .where('c1.id', id)
      .modify(channels.authorizedViewSubquery, user, { table: 'c1' })
      .modify(channels.authorizedViewSubquery, user, { table: 'c2' });
  };

  channels.getFollowings = function(user, id) {
    return db.knex
      .select('c2.id', 'c2.name', 'c2.description')
      .from(`${channels.table} as c1`)
      .leftJoin(`${db.channelFollowers.table}`, `${db.channelFollowers.table}.followerId`, 'c1.id')
      .leftJoin(`${channels.table} as c2`, `${db.channelFollowers.table}.followeeId`, 'c2.id')
      .where('c1.id', id)
      .modify(channels.authorizedViewSubquery, user, { table: 'c1' })
      .modify(channels.authorizedViewSubquery, user, { table: 'c2' });
  };

  channels.editChannel = function(user, id, channel) {
    return db.knex.transaction(function(trx) {
      return trx(db.channelAcls.table)
        .where('channelId', id)
        .del()
        .then(function() {
          var acls = formatChannelACL(channel);
          return Promise.all(
            acls.map(function(acl) {
              return trx(db.channelAcls.table).insert({
                channelId: id,
                id: acl.id,
                access: acl.access,
                type: acl.type,
              });
            }),
          );
        })
        .then(function() {
          return trx(channels.table)
            .update({
              name: channel.name,
              description: channel.description,
              privacy: channel.privacy,
            })
            .where('id', id)
            .modify(channels.authorizedManageSubquery, user);
        });
    });
  };

  channels.createChannel = function(channel, user) {
    let sub = null;
    let initialSub = null;
    return db.knex.transaction(function(trx) {
      return db.subscriptions
        .getInitialSubscription()
        .then(function(activeSubscription) {
          if (!activeSubscription || !activeSubscription.id) {
            throw new Error("Couldn't find a valid subscription");
          }
          initialSub = activeSubscription.id;
          return trx(channels.table).insert({
            id: channel.id,
            name: channel.name,
            description: channel.description,
            privacy: channel.privacy,
            personal: channel.personal,
            verified: !!channel.personal,
            activeSubscriptionId: initialSub,
          });
        })
        .then(function() {
          var acls = formatChannelACL(channel);
          return Promise.all(
            acls.map(function(acl) {
              return trx(db.channelAcls.table).insert({
                channelId: channel.id,
                id: acl.id,
                access: acl.access,
                type: acl.type,
              });
            }),
          );
        })
        .then(function() {
          return trx(db.workflows.table)
            .insert({
              id: db.workflows.generateId(),
              type: 'CREATE_CHANNEL',
              requester: user && user.id,
              subject: channel.id,
            })
            .returning('id');
        })
        .then(function(ids) {
          return trx(db.workflowActivities.table)
            .insert({
              id: db.workflowActivities.generateId(),
              workflowId: ids[0],
              name: 'KABAM',
            })
            .then(function() {
              return ids[0];
            });
        });
    });
  };

  channels.checkAuth = function(channelId, user) {
    return db.knexnest(
      db
        .knex(channels.table)
        .count('*')
        .where(`${channels.table}.id`, channelId)
        .modify(channels.authorizedViewSubquery, user),
    );
  };

  channels.checkAuthManage = function(channelId, user) {
    return db.knexnest(
      db
        .knex(channels.table)
        .count('*')
        .where(`${channels.table}.id`, channelId)
        .modify(channels.authorizedManageSubquery, user),
    );
  };

  channels.userLogin = function(user) {
    return db.knex.transaction(function(trx) {
      return trx
        .select('id', 'name', 'description', 'personal')
        .from(channels.table)
        .where('id', user.id)
        .then(function(res) {
          if (res.length === 0) {
            return trx(channels.table)
              .insert({
                id: user.id,
                name: user.name,
                description: user.description,
                personal: true,
                verified: true
              })
              .then(function() {
                return trx
                  .select('id', 'name', 'description', 'personal')
                  .from(channels.table)
                  .where('id', user.id);
              });
          }
          return res;
        });
    });
  };

  channels.searchChannels = function(user, query) {
    return this.select(
      `${channels.table}.id as _id`,
      `${channels.table}.createdAt as _createdAt`,
      `${channels.table}.name as _name`,
      `${channels.table}.description as _description`,
      db.knex.raw('NULL as _channel_id'),
      db.knex.raw('NULL as _channel_name'),
      db.knex.raw('search.rank as _rank'),
    )
      .select(db.knex.raw('NULL as ??', ['_viewCount']))
      .select(db.knex.raw('NULL as ??', ['_likeCount']))
      .select(
        db.knex.raw('?? IS NOT NULL as ??', [
          `${db.channelFollowers.table}.followerId`,
          '_isFollowing',
        ]),
      )
      .select(db.knex.raw('? as ??', ['channel', '_type']))
      .from(channels.table)
      .leftJoin(db.channelFollowers.table, function() {
        this.on('followerId', db.knex.raw('?', [user && user.id])).on(
          'followeeId',
          `${channels.table}.id`,
        );
      })
      .innerJoin(
        db
          .knex(`${channels.table}`)
          .select(
            db.knex.raw(`ts_rank(??, to_tsquery('english', ''' ' || ? || ' ''')) as rank`, [
              `${channels.table}.tsv`,
              query,
            ]),
          )
          .select(`${channels.table}.id as search_id`)
          .where('tsv', '@@', db.knex.raw(`to_tsquery('english', ''' ' || ? || ' ''')`, [query]))
          .as('search'),
        `${channels.table}.id`,
        'search.search_id',
      )
      .where(`${channels.table}.verified`, true)
      .groupBy(`${channels.table}.id`, 'search.rank', `${db.channelFollowers.table}.followerId`)
      .modify(channels.order, 'relevance')
      .modify(channels.authorizedViewSubquery, user, { channelsName: 'c2' });
  };
  channels.search = channels.searchChannels.bind(db.knex);

  function formatChannelACL(channel) {
    var channelACL =
      channel.privacy === 'PUBLIC'
        ? []
        : (channel.viewACL || []).map(function(acl) {
            acl.access = 'VIEW';
            return acl;
          });
    (channel.manageACL || []).forEach(function(acl) {
      var index = channelACL.findIndex(function(cAcl) {
        return cAcl.id === acl.id && cAcl.type === acl.type;
      });
      if (index !== -1) {
        channelACL[index].access = 'MANAGE';
      } else {
        acl.access = 'MANAGE';
        channelACL.push(acl);
      }
    });
    return channelACL;
  }

  channels.getQuotaStatus = function(user, channel) {
    return db.knexnest(
      db.knex
        .select('id', 'total', 'used', db.knex.raw('(?? - ??) as free', ['total', 'used']))
        .from(function() {
          this.select(`${channels.table}.id`)
            .select(
              db.knex.raw('(cast(?? as bigint) * ?) as total', [
                `${db.plans.table}.sizeQuota`,
                1048576,
              ]),
            )
            .select(db.knex.raw(`sum(coalesce(${db.videos.table}.metadata_size, 0)) as used`))
            .from(channels.table)
            .leftJoin(db.videos.table, `${channels.table}.id`, `${db.videos.table}.channelId`)
            .leftJoin(
              db.subscriptions.table,
              `${channels.table}.activeSubscriptionId`,
              `${db.subscriptions.table}.id`,
            )
            .leftJoin(db.plans.table, `${db.plans.table}.id`, `${db.subscriptions.table}.planId`)
            .groupBy(`${channels.table}.id`, `${db.plans.table}.sizeQuota`)
            .where(`${channels.table}.id`, channel)
            .modify(channels.authorizedManageSubquery, user)
            .as('quota');
        }),
    );
  };

  channels.getChannelStats = function(user, chs) {
    return db.knexnest(
      db.knex
        .countDistinct(`${db.channelFollowers.table}.followerId as followerCount`)
        .countDistinct(`${db.videos.table}.id as videoCount`)
        .countDistinct(`${db.playlists.table}.id as playlistCount`)
        .countDistinct(`${db.comments.table}.id as commentCount`)
        .countDistinct(`${db.videoLikes.table}.createdAt as likeCount`)
        .countDistinct(`${db.videoViews.table}.createdAt as viewCount`)
        .from(channels.table)
        .leftJoin(db.videos.table, `${db.videos.table}.channelId`, `${channels.table}.id`)
        .leftJoin(db.playlists.table, `${db.playlists.table}.channelId`, `${channels.table}.id`)
        .leftJoin(
          db.channelFollowers.table,
          `${channels.table}.id`,
          `${db.channelFollowers.table}.followeeId`,
        )
        .leftJoin(db.videoLikes.table, `${db.videos.table}.id`, `${db.videoLikes.table}.videoId`)
        .leftJoin(db.videoViews.table, `${db.videos.table}.id`, `${db.videoViews.table}.videoId`)
        .leftJoin(db.comments.table, `${db.videos.table}.id`, `${db.comments.table}.videoId`)
        .whereIn(`${channels.table}.id`, chs)
        .modify(channels.authorizedManageSubquery, user),
    );
  };

  channels.getChannelSubscriptions = function getChannelSubscriptions(id, user) {
    return db.knexnest(
      db.knex
        .select(
          `${db.subscriptions.table}.id as _subscription_id`,
          `${db.subscriptions.table}.from as _subscription_from`,
          `${db.subscriptions.table}.to as _subscription_to`,
          `${db.plans.table}.id as _subscription_plan_id`,
          `${db.plans.table}.name as _subscription_plan_name`,
          `${db.plans.table}.price as _subscription_plan_price`,
          `${db.plans.table}.sizeQuota as _subscription_plan_sizeQuota`,
          `${db.plans.table}.videoQuota as _subscription_plan_videoQuota`,
        )
        .from(channels.table)
        .leftJoin(
          db.subscriptions.table,
          `${channels.table}.activeSubscriptionId`,
          `${db.subscriptions.table}.id`,
        )
        .leftJoin(db.plans.table, `${db.subscriptions.table}.planId`, `${db.plans.table}.id`)
        .where(`${channels.table}.id`, id)
        .modify(channels.authorizedManageSubquery, user),
    );
  };

  return channels;
};

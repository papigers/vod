module.exports = function(db) {
  var channels = function Channel() {
    if (!(this instanceof Channel)) {
      return new Channel();
    }
  }

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
      type: enu,
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

  channels.authorizedManage = function(queryBuilder, user, options = {}) {
    var userId = user && user.id;
    var groups = user && user.groups || [];
    var tableName = options.table || channels.table;
    var aclName = options.table ? `${db.channelAcls.table}_${options.table}` : db.channelAcls.table;

    return queryBuilder.leftJoin(`${db.channelAcls.table} as ${aclName}`, `${tableName}.id`, `${aclName}.channelId`)
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

  channels.authorizedManageSubquery = function(queryBuilder, user, options) {
    return queryBuilder.whereIn('id', function() {
      this.select(`${channels.table}.id`).from(channels.table).modify(channels.authorizedManage, user, options);
    });
  }

  channels.authorizedView = function(queryBuilder, user, options = {}) {
    var userId = user && user.id;
    var groups = user && user.groups || [];
    var tableName = options.table || channels.table;
    var aclName = options.table ? `${db.channelAcls.table}_${options.table}` : 'db.channelAcls.table';

    return queryBuilder.leftJoin(`${db.channelAcls.table} as ${aclName}`, `${tableName}.id`, `${aclName}.channelId`)
      .where(function() {
        this.where(`${tableName}.id`, userId)
        .orWhere(`${tableName}.privacy`, 'PUBLIC')
        .orWhere(function() {
          this.where(`${tableName}.privacy`, 'PRIVATE')
          .andWhere(function() {
            this.where(function() {
              this.where(`${aclName}.id`, userId)
              .andWhere(`${aclName}.type`, 'USER');
            })
            .orWhere(function() {
              this.whereIn(`${aclName}.id`, groups)
              .andWhere(`${aclName}.type`, 'AD_GROUP')
            });
          });
        });
      });
  };

  channels.authorizedViewSubquery = function(queryBuilder, user, options) {
    return queryBuilder.whereIn('id', function() {
      this.select(`${channels.table}.id`).from(channels.table).modify(channels.authorizedView, user, options);
    });
  }

  channels.getManagedChannels = function(user) {
    return db.knex.select('id', 'name').from(channels.table).modify(channels.authorizedManage, user);
  };

  channels.getChannelVideos = function(user, channelId, limit, offset, sort) {
    return db.knex.table(channels.table).innerJoin(db.videos.table, `${channels.table}.id`, `${db.videos.table}.channelId`)
      .select(`${db.videos.table}.id`, `${db.videos.table}.createdAt`, `${db.videos.table}.name`, `${db.videos.table}.description`)
      .select(knex.raw('COUNT(??) as ??', [`${db.videoViewss.table}.channelId`, 'views']))
      .where(`${channels.table}.id`, channelId)
      .limit(limit)
      .offset(offset)
      .leftJoin(`${db.videoViews.table}`, `${db.videos.table}.id`, `${db.videoViews.table}.videoId`)
      .groupBy(`${db.videos.table}.id`)
      .modify(db.videos.order, sort)
      .modify(channels.authorizedView, user)
      .modify(db.videos.authorizedView, user);
  };

  channels.getChannel = function(user, id) {
    return db.knex.select('id', 'personal', 'name', 'description').from(channels.table)
      .select(knex.raw('EXISTS(?) as ??', [
        db.knex.table(db.channelFollowers.table).select(1).where('followerId', user && user.id).andWhere('followeeId', id).limit(1),
        'isFollowing',
      ]))
      .where('id', id)
      .modify(channels.authorizedView, user)
  }

  channels.deleteChannel = function(user, channelId) {
    return db.knex(channels.table).where('id', channelId).modify(channels.authorizedManageSubquery, user).del();
  };

  channels.deleteChannelAdmin = function(channelId) {
    return db.knex(channels.table).where('id', channelId).del();
  };

  channels.followChannel = function(user, id) {
    return db.knex(db.knex.raw('?? (??, ??)', [`${db.channelFollowers.table}`, 'followerId', 'followeeId'])).insert(
      db.knex.select(db.knex.raw('?, ?', [user && user.id, id])).from(channels.table)
        .where(`${channels.table}.id`, id).modify(channels.authorizedView, user)
    );
  };

  channels.unfollowChannel = function(user, id) {
    return db.knex(db.channelFollowers.table).where({
      followerId: user && user.id,
      followeeId: id,
    }).del();
  };

  channels.getFollowers = function(user, id) {
    return db.knex.select('c2.id', 'c2.name', 'c2.description').from(`${channels.table} as c1`)
      .leftJoin(`${channelFollowers.table}`, `${channelFollowers.table}.followeeId`, 'c1.id')
      .leftJoin(`${channels.table} as c2`, `${channelFollowers.table}.followerId`, 'c2.id')
      .where('c1.id', id)
      .modify(channels.authorizedView, user, { table: 'c1' })
      .modify(channels.authorizedView, user, { table: 'c2' });
  };

  channels.getFollowings = function(user, id) {
    return db.knex.select('c2.id', 'c2.name', 'c2.description').from(`${channels.table} as c1`)
      .leftJoin(`${channelFollowers.table}`, `${channelFollowers.table}.followerId`, 'c1.id')
      .leftJoin(`${channels.table} as c2`, `${channelFollowers.table}.followeeId`, 'c2.id')
      .where('c1.id', id)
      .modify(channels.authorizedView, user, { table: 'c1' })
      .modify(channels.authorizedView, user, { table: 'c2' });
  };

  channels.editChannel = function(user, id, channel) {
    return db.knex.transaction(function(trx) {
      return trx(channels.table)
        .update({
          name: channel.name,
          description: channel.description,
          privacy: channel.privacy,
          personal: channel.personal,
        })
        .where('id', id)
        .modify(channels.authorizedManageSubquery, user)
        .then(function() {
          return trx(db.channelAcls.table).where('channelId', id).del();
        })
        .then(function() {
          var acls = formatChannelACL(channel);
          return Promise.all(acls.map(function(acl) {
            return trx(db.channelAcls.table).insert({
              channelId: id,
              id: acl.id,
              access: acl.access,
              type: acl.type,
            });
          }));
        });
    });
  }

  channels.createChannel = function(channel) {
    return db.knex.transaction(function(trx) {
      return trx(channels.table)
        .insert({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          privacy: channel.privacy,
          personal: channel.personal,
        })
        .then(function() {
          var acls = formatChannelACL(channel);
          return Promise.all(acls.map(function(acl) {
            return trx(db.channelAcls.table).insert({
              channelId: channel.id,
              id: acl.id,
              access: acl.access,
              type: acl.type,
            });
          }));
        });
    });
  };

  channels.checkAuth = function(channelId, user) {
    return db.knex(channels.table).count('*').where('id', channelId).modify(channels.authorizedView, user);
  }

  channels.userLogin = function(user) {
    return db.knex.transaction(function(trx) {
      return trx.select('id', 'name', 'description', 'personal').from(channels.table).where('id', user.id)
        .then(function(res) {
          if (res.length === 0) {
            return trx(channels.table).insert({
              id: user.id,
              name: user.name,
              description: user.description,
              personal: true,
            }).then(function() {
              return trx.select('id', 'name', 'description', 'personal').from(channels.table).where('id', user.id);
            });
          }
          return res[0];
        });
    });
  }

  function formatChannelACL(channel) {
    var channelACL = channel.privacy === 'PUBLIC' ? [] : channel.viewACL.map(function(acl) {
      acl.access = 'VIEW';
      return acl;
    });
    channel.manageACL.forEach(function(acl) {
      var index = channelACL.findIndex(function(cAcl) {
        return cAcl.id === acl.id && cAcl.type === acl.type;
      });
      if (index !== -1) {
        channelACL[index].access = 'MANAGE';
      }
      else {
        acl.access = 'MANAGE';
        channelACL.push(acl);
      }
    });
    return channelACL;
  }

  return channels;
};

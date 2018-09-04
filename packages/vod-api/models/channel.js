var Op = require('sequelize').Op;

module.exports = function(sequelize, DataTypes) {
  var Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    personal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    privacy: {
      type: DataTypes.ENUM(['PUBLIC', 'PRIVATE']),
      defaultValue: 'PUBLIC',
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    scopes: {
      canManage: function(userId, groups) {
        var userId = userId || 's7591665';
        var groups = groups || [];

        return {
          where: {
            [Op.or]: [{
              id: userId,
            }, {
              '$channelACL.id$': userId,
              '$channelACL.type$': 'USER',
              '$channelACL.access$': 'MANAGE',
            }, {
              '$channelACL.id$': {
                [Op.in]: groups,
              },
              '$channelACL.type$': 'AD_GROUP',
              '$channelACL.access$': 'MANAGE',
            }],
          },
          include: [{
            model: sequelize.models.ChannelAccess,
            as: 'channelACL',
            attributes: [],
            required: false,
          }],
        }
      },
    }
  });

  Channel.associate = function(models) {
    Channel.hasMany(models.Video, {
      as: 'videos',
      foreignKey: {
        name: 'channelId',
        allowNull: false,
      },
    });
    Channel.hasMany(models.Video, {
      as: 'createdVideos',
      foreignKey: {
        name: 'creatorId',
        allowNull: false,
      },
    });
    Channel.belongsToMany(Channel, {
      as: 'followers',
      foreignKey: {
        name: 'followeeId',
        onDelete: 'CASCADE',
      },
      through: 'ChannelFollowers',
    });
    Channel.belongsToMany(Channel, {
      as: 'followings',
      foreignKey: {
        name: 'followerId',
        onDelete: 'CASCADE',
      },
      through: 'ChannelFollowers',
    });
    Channel.belongsToMany(models.Video, { as: 'likes', through: 'VideoLikes' });
    Channel.belongsToMany(models.Video, {
      as: 'views',
      through: {
        model: models.VideoView,
        unique: false,
      },
    });
    Channel.belongsToMany(models.Video, { through: models.Comment });
    Channel.ChannelACL = Channel.hasMany(models.ChannelAccess, {
      as: 'channelACL',
      onDelete: "CASCADE",
      allowNull: false,
    });

    Channel.setClassMethods(models);
  };

  Channel.setClassMethods = function(models) {

    Channel.addAuthorizedFilter = function(filter, userId, groups) {
      // mock auth
      var userId = userId || 's7591665';
      var groups = groups || [];

      var authWhere = {
        [Op.or]: [{
            id: userId,
          }, {
            privacy: 'PUBLIC',
          }, {
            privacy: 'PRIVATE',
            [Op.or]: [{
              '$channelACL.id$': userId,
              '$channelACL.type$': 'USER',
            }, {
              '$channelACL.id$': {
                [Op.in]: groups,
              },
              '$channelACL.type$': 'AD_GROUP',
            }],
          },
        ],
      };

      var authInclude = [{
        model: models.ChannelAccess,
        as: 'channelACL',
        required: false,
        attributes: [],
        duplicating: false, // pg sequelize bug: https://github.com/sequelize/sequelize/issues/8432
      }];

      filter.where = filter.where ? {
        [Op.and]: [filter.where, authWhere]
      } : authWhere;

      if (filter.include) {
        var channelAclInclude = false;
        filter.include = filter.include.map(function(incl) {
          if (incl.model === models.ChannelAccess) {
            channelAclInclude = true;
            return Object.assign(authInclude[0], incl);
          }
          return incl;
        });
        if (!channelAclInclude) {
          filter.include.push(authInclude[0]);
        }
      }
      else {
        filter.include = authInclude;
      }
      return filter;
    };

    Channel.getManagedChannels = function() {
      return Channel.scope({
        method: ['canManage', null, null],
      }).findAll({
        attributes: ['id', 'name'],
      });
    }

    Channel.getChannelVideos = function(channelId, limit, offset, sort) {
      return Channel.findOne(Channel.addAuthorizedFilter({
        attributes: ['id'],
        where: {
          id: channelId,
        },
      })).then(function(channel) {
        return channel.getVideos(models.Video.addAuthorizedFilter({
          attributes: ['id', 'createdAt', 'name', 'description'],
          limit,
          offset,
          order: models.Video.getFilterOrder(sort),
          include: [{
            model: Channel,
            as: 'channel',
            attributes: ['id', 'name'],
          }],
        }));
      });
    }

    Channel.getChannel = function(videoId) {
      return Channel.findOne(Channel.addAuthorizedFilter({
        attributes: ['id', 'personal', 'name', 'description'],
        where: {
          id: videoId,
        },
      })).then(function(channel) {
        return Promise.all([
          channel,
          channel.hasFollower('s7591665'),
        ]);
      });
    }

    Channel.deleteChannel = function(videoId) {
      return Channel.destroy({
        where: {
          id: videoId,
        },
      });
    }

    Channel.followChannel = function(id) {
      return Channel.findById(id)
        .then(function(channel) {
          channel.addFollower('s7591665');
        });
    };

    Channel.unfollowChannel = function(id) {
      return Channel.findById(id)
        .then(function(channel) {
          channel.removeFollower('s7591665');
        });
    };

    Channel.getFollowers = function(id) {
      return Channel.findOne({
        attributes: ['id'],
        where: {
          id: id,
        },
        include: [{
          model: Channel,
          as: 'followers',
          attributes: ['id', 'name', 'description'],
          through: {
            attributes: []
          },
        }],
      }).then(function(followers) {
        return Promise.resolve(followers.get('followers'));
      });
    }

    Channel.getFollowings = function(id) {
      return Channel.findOne({
        attributes: ['id'],
        where: {
          id: id,
        },
        include: [{
          model: Channel,
          as: 'followings',
          attributes: ['id', 'name', 'description'],
          through: {
            attributes: []
          },
        }],
      }).then(function(followings) {
        return Promise.resolve(followings.get('followings'));
      });
    }

    Channel.editChannel = function(id, channel) {
      var Acls = models.embed.util.helpers.mkInclude(Channel.ChannelACL);
      channel.channelACL = channel.acl;
      return Channel.findById(id)
        .then(function(found) {
          if (!found) {
            return null;
          }
          return models.embed.update(Channel, {
            id: channel.id,
            name: channel.name,
            description: channel.description,
            personal: channel.personal,
          }, [Acls]);
        });      
    };

    Channel.createChannel = function(channel) {
      var Acls = models.embed.util.helpers.mkInclude(Channel.ChannelACL);
      console.log(channel);
      var acls = channel.viewACL.map(function(acl) {
        acl.access = 'VIEW';
        return acl;
      });
      channel.manageACL.forEach(function(acl) {
        var index = acls.findIndex(function(viewACL) {
          return viewACL.id === acl.id && viewACL.type === acl.type;
        });
        if (index !== -1) {
          acls[index].access = 'MANAGE';
        }
        else {
          acl.access = 'MANAGE';
          acls.push(acl);
        }
      });

      return models.embed.insert(Channel, {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        personal: channel.personal,
        channelACL: acls,
      }, [Acls])
    };
  }

  Channel.checkAuth = function(cahnnelId, userId, groups) {
    return Channel.count(Channel.addAuthorizedFilter({
      where: {
        id: cahnnelId,
      },
    }, userId, groups));
  };

  return Channel;
};

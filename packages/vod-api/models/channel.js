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
      authorizedManage: function(userId, groups) {
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
        };
      },
      authorizedView: function(userId, groups) {
        var userId = userId || 's7591665';
        var groups = groups || [];

        return {
          where: {
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
            }],
          },
          include: [{
            model: sequelize.models.ChannelAccess,
            as: 'channelACL',
            attributes: [],
            required: false,
            duplicating: false,
          }],
        };
      },
    },
  });

  function formatChannelACL(channel, privacy) {
    var channelACL = privacy === 'PUBLIC' ? [] : channel.viewACL.map(function(acl) {
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

    Channel.authorizedManage = function(userId, groups) {
      return { method: ['authorizedManage', userId, groups] };
    }
    Channel.authorizedView = function(userId, groups) {
      return { method: ['authorizedView', userId, groups] };
    }

    Channel.getManagedChannels = function() {
      return Channel.scope(Channel.authorizedManage(null, null)).findAll({
        attributes: ['id', 'name'],
      });
    }

    Channel.getVideoFilterOrder = function(sort) {
      var order = models.Video.getFilterOrder(sort).map(function(orderPart) {
        if (!orderPart[0].fn) {
          orderPart.unshift(Channel.associations.videos);
        }
        return orderPart;
      });
      console.log(order);
      return order;
    };

    Channel.getChannelVideos = function(channelId, limit, offset, sort) {
      return Channel.scope(Channel.authorizedView(null, null)).findOne({
        attributes: ['id', 'name'],
        where: {
          id: channelId,
        },
        include: [{
          model: models.Video.scope(models.Video.authorizedView(null, null)),
          as: 'videos',
          limit,
          offset,
          order: models.Video.getFilterOrder(sort),
          separate: true,
          attributes: ['id', 'createdAt', 'name', 'description', 'channelId'],
        }],
      });
    }

    Channel.getChannel = function(videoId) {
      return Channel.scope(Channel.authorizedView(null, null)).findOne({
        attributes: ['id', 'personal', 'name', 'description'],
        where: {
          id: videoId,
        },
      }).then(function(channel) {
        return Promise.all([
          channel,
          channel.hasFollower('s7591665'),
        ]);
      });
    }

    Channel.deleteChannel = function(videoId) {
      return Channel.scope(Channel.authorizedManage(null, null)).destroy({
        where: {
          id: videoId,
        },
      });
    }

    Channel.followChannel = function(id) {
      return Channel.scope(Channel.authorizedView(null, null)).findById(id)
        .then(function(channel) {
          channel.addFollower('s7591665');
        });
    };

    Channel.unfollowChannel = function(id) {
      return Channel.scope(Channel.authorizedView(null, null)).findById(id)
        .then(function(channel) {
          channel.removeFollower('s7591665');
        });
    };

    Channel.getFollowers = function(id) {
      return Channel.scope(Channel.authorizedView(null, null)).findOne({
        attributes: ['id'],
        where: {
          id: id,
        },
      }).then(function(channel) {
        return channel.getFollowers({
          scope: Channel.authorizedView(null, null),
          attributes: ['id', 'name', 'description'],
        });
      });
    }

    Channel.getFollowings = function(id) {
      return Channel.scope(Channel.authorizedView(null, null)).findOne({    
        attributes: ['id'],
        where: {
          id: id,
        },
      }).then(function(channel) {
        return channel.getFollowings({
          scope: Channel.authorizedView(null, null),
          attributes: ['id', 'name', 'description'],
        });
      });
    }

    Channel.editChannel = function(id, channel) {
      var Acls = models.embed.util.helpers.mkInclude(Channel.ChannelACL);
      return Channel.scope(Channel.authorizedManage(null, null)).findById(id)
        .then(function(found) {
          if (!found) {
            return null;
          }
          var privacy = channel.privacy || found.get('privacy');
          var channelACL = formatChannelACL(channel, privacy);

          return models.embed.update(Channel, {
            id: id,
            name: channel.name,
            description: channel.description,
            privacy,
            personal: channel.personal,
            channelACL,
          }, [Acls]);
        });      
    };

    Channel.createChannel = function(channel) {
      var Acls = models.embed.util.helpers.mkInclude(Channel.ChannelACL);
      var privacy = channel.privacy || 'PUBLIC';
      var channelACL = formatChannelACL(channel, privacy);

      return models.embed.insert(Channel, {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        personal: channel.personal,
        channelACL,
      }, [Acls])
    };
  }

  Channel.checkAuth = function(cahnnelId, userId, groups) {
    return Channel.scope(Channel.authorizedView(userId, groups)).count({
      where: {
        id: cahnnelId,
      },
    });
  };

  return Channel;
};

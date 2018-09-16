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
      authorizedManage: function(user) {
        var userId = user && user.id
        var groups = user && user.groups || [];

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
      authorizedView: function(user) {
        var userId = user && user.id
        var groups = user && user.groups || [];

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

    Channel.authorizedManage = function(user) {
      return { method: ['authorizedManage', user] };
    }
    Channel.authorizedView = function(user) {
      return { method: ['authorizedView', user] };
    }

    Channel.getManagedChannels = function(user) {
      return Channel.scope(Channel.authorizedManage(user)).findAll({
        attributes: ['id', 'name'],
      });
    }

    Channel.getChannelVideos = function(user, channelId, limit, offset, sort) {
      return Channel.scope(Channel.authorizedView(user)).findOne({
        attributes: ['id'],
        where: {
          id: channelId,
        },
        include: [{
          model: models.Video.scope(['defaultScope', models.Video.authorizedView(user)]),
          as: 'videos',
          limit,
          offset,
          order: models.Video.getFilterOrder(sort),
          separate: true,
          attributes: ['id', 'createdAt', 'name', 'description', 'channelId'],
        }],
      }).then(function(channel) {
        var countMap = channel.videos.map(function(video) {
          return video.countViews();
        });
        return Promise.all(countMap).then(function(viewCounts) {
          return channel.videos.map(function(video, index) {
            var resVideo = video.get({ plain: true });
            resVideo.viewCount = viewCounts[index];
            return resVideo;
          });
        });
      });
    }

    Channel.getChannel = function(user, id) {
      return Channel.scope(Channel.authorizedView(user)).findOne({
        attributes: ['id', 'personal', 'name', 'description'],
        where: {
          id,
        },
      }).then(function(channel) {
        return Promise.all([
          channel,
          channel ? channel.hasFollower(user && user.id) : false,
        ]);
      });
    }

    Channel.deleteChannel = function(user, channelId) {
      return Channel.scope(Channel.authorizedManage(user)).destroy({
        where: {
          id: channelId,
        },
      });
    }

    Channel.deleteChannelAdmin = function(channelId) {
      return Channel.destroy({
        where: {
          id: channelId,
        },
      });
    }

    Channel.followChannel = function(user, id) {
      return Channel.scope(Channel.authorizedView(user)).findById(id)
        .then(function(channel) {
          channel.addFollower(user && user.id);
        });
    };

    Channel.unfollowChannel = function(user, id) {
      return Channel.scope(Channel.authorizedView(user)).findById(id)
        .then(function(channel) {
          channel.removeFollower(user && user.id);
        });
    };

    Channel.getFollowers = function(user, id) {
      return Channel.scope(Channel.authorizedView(user)).findOne({
        attributes: ['id'],
        where: {
          id: id,
        },
      }).then(function(channel) {
        if (!channel) {
          return null;
        }
        
        return channel.getFollowers({
          scope: Channel.authorizedView(user),
          attributes: ['id', 'name', 'description'],
        });
      });
    }

    Channel.getFollowings = function(user, id) {
      return Channel.scope(Channel.authorizedView(user)).findOne({    
        attributes: ['id'],
        where: {
          id: id,
        },
      }).then(function(channel) {
        if (!channel) {
          return null;
        }

        return channel.getFollowings({
          scope: Channel.authorizedView(user),
          attributes: ['id', 'name', 'description'],
        });
      });
    }

    Channel.editChannel = function(user, id, channel) {
      var Acls = models.embed.util.helpers.mkInclude(Channel.ChannelACL);
      return Channel.scope(Channel.authorizedManage(user)).findById(id)
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

  Channel.checkAuth = function(cahnnelId, user) {
    return Channel.scope(Channel.authorizedView(user)).count({
      where: {
        id: cahnnelId,
      },
    });
  };

  Channel.userLogin = function(user) {
    user.personal = true;
    return Channel.findOrCreate({
      where: {
        id: user.id,
      },
      defaults: user,
      attributes: ['id', 'name', 'description', 'personal'],
    });
  }

  return Channel;
};

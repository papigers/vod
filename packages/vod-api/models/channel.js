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
    Channel.belongsToMany(models.Video, { through: models.Comment });
    Channel.ChannelACL = Channel.hasMany(models.ChannelAccess, { as: 'channelACL' });

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

    Channel.getChannelVideos = function(channelId, limit, offset, sort) {
      console.log('channelId', channelId, arguments);
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
        // include: [{
        //   model: models.Video,
        //   as: 'videos',
        //   where: {
        //     published: true,
        //   },
        //   duplicating: false,
        //   attributes: ['id', 'name'],
        // }],
      }));
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
      channel.channelACL = channel.acl;
      return models.embed.insert(Channel, {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        personal: channel.personal,
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

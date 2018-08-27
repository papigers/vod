module.exports = function(sequelize, DataTypes) {
  var Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    picture: DataTypes.STRING,
    cover: DataTypes.STRING,
    personal: DataTypes.BOOLEAN,
    // access: DataTypes.ENUM(['PUBLIC', 'PRIVATE', 'SHARED']),
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    isAdmin: DataTypes.BOOLEAN,
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

    Channel.getChannel = function(videoId) {
      return Channel.findOne(Channel.addAuthorizedFilter({
        attributes: ['id', 'picture', 'cover', 'personal'],
        where: {
          id: videoId,
        },
        include: [{
          model: models.Video,
          as: 'videos',
          where: {
            published: true,
          },
          attributes: ['id', 'name'],
        }],
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
            picture: channel.picture,
            cover: channel.cover,
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
        picture: channel.picture,
        cover: channel.cover,
      }, [Acls])
    };
  }

  return Channel;
};

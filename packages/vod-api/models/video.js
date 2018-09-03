var Op = require('sequelize').Op;
var nanoid = require('nanoid');

module.exports = function(sequelize, DataTypes) {
  var Video = sequelize.define('Video', {
    id: {
      type: DataTypes.CHAR(12),
      primaryKey: true,
      unique: true,
      defaultValue: nanoid.bind(this, 12),
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    privacy: {
      type: DataTypes.ENUM(['public', 'private', 'channel']),
      defaultValue: 'private',
    },
  }, {
    defaultScope: {
      where: {
        published: true,
      },
    },
    scopes: {
      unpublished: {
        where: {
          published: false,
        },
      },
    },
  });

  Video.associate = function(models) {
    Video.VideoACL = Video.hasMany(models.VideoAccess, {
      as: 'videoACL',
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
      },
    });
    Video.belongsToMany(models.Channel, { as: 'likes', through: 'VideoLikes' });
    Video.belongsToMany(models.Channel, {
      as: 'views',
      through: {
        model: models.VideoView,
        unique: false,
      },
    });
    Video.belongsToMany(models.Channel, { through: models.Comment });
    // creator of video
    Video.belongsTo(models.Channel, {
      as: 'creator',
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
      },
    });
    // video's channel (location)
    Video.belongsTo(models.Channel, {
      as: 'channel',
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
      },
    });

    Video.setClassMethods(models);
  };

  Video.setClassMethods = function(models) {

    Video.addAuthorizedFilter = function(filter, userId, groups) {
      // mock auth
      var userId = userId || 's7591665';
      var groups = groups || [];

      var authWhere = {
        [Op.or]: [{
            channelId: userId,
          }, {
            privacy: 'public',
          }, {
            privacy: {
              [Op.ne]: 'public',
            },
            [Op.or]: [{
              '$videoACL.id$': userId,
              '$videoACL.type$': 'USER',
            }, {
              '$videoACL.id$': {
                [Op.in]: groups,
              },
              '$videoACL.type$': 'AD_GROUP',
            }],
          }, {
            privacy: 'channel',
            [Op.or]: [{
              '$channel.channelACL.id$': userId,
              '$channel.channelACL.type$': 'USER',
            }, {
              '$channel.channelACL.id$': {
                [Op.in]: groups,
              },
              '$channel.channelACL.type$': 'AD_GROUP',
            }],
          },
        ],
      };

      var authInclude = [{
          model: models.VideoAccess,
          as: 'videoACL',
          required: false,
          attributes: [],
          duplicating: false, // pg sequelize bug: https://github.com/sequelize/sequelize/issues/8432
        }, {
          model: models.Channel,
          as: 'channel',
          required: false,
          attributes: ['id'],
          include: [{
            model: models.ChannelAccess,
            as: 'channelACL',
            attributes: [],
            duplicating: false, // pg sequelize bug: https://github.com/sequelize/sequelize/issues/8432
            required: false,
          }],
        },
      ];

      filter.where = filter.where ? {
        [Op.and]: [filter.where, authWhere]
      } : authWhere;

      if (filter.include) {
        var videoAclInclude = false;
        var channelInclude = false;
        var channelAclInclude = false;
        filter.include = filter.include.map(function(incl) {
          if (incl.model === models.VideoAccess) {
            videoAclInclude = true;
            return Object.assign(authInclude[0], incl);
          }
          if (incl.model === models.Channel && incl.as === 'channel') {
            channelInclude = true;
            var include = Object.assign(authInclude[1], incl);
            var subInclude = authInclude[1].include[0];
            if (incl.include) {
              include.include = [];
              incl.include.forEach(function(incl2) {
                if (incl2.model === subInclude.model) {
                  channelAclInclude = true;
                  include.include.push(Object.assign(subInclude, incl2));
                }
                else {
                  include.include.push(incl2);
                }
              });
              if (!channelAclInclude) {
                include.include = subInclude;
              }
            }
            return include;
          }
          return incl;
        });
        if (!videoAclInclude) {
          filter.include.push(authInclude[0]);
        }
        if (!channelInclude) {
          filter.include.push(authInclude[1]);
        }
      }
      else {
        filter.include = authInclude;
      }
      return filter;
    };

    /**
     * 
     * @param {Object} video - the video to create
     * @param {string} creator - the channel id of the video's creator
     * @param {string} channel - video's channel id
     * @param {string} name - video's initial name: file name
     * @returns {Promise} Video creation promise
     */
    Video.initialCreate = function(video) {
      return Video.findOrCreate({
        where: {
          channelId: video.channel,
          creatorId: video.creator,
          name: video.name,
          published: false,
        },
        defaults: {
          channelId: video.channel,
          creatorId: video.creator,
          name: video.name,
          published: false,
        },
      }).spread(function(videoDb) {
        videoDb.setChannel(video.channel);
        videoDb.setCreator(video.creator);
        return Promise.resolve(videoDb);
      });
    }

    /**
     * editting video after all info is available
     * @param {string} id Video's id to publish
     * @param {Video} video video's attributes
     */
    Video.edit = function(id, video) {
      if (video.privacy === 'public') {
        video.acl = [];
      }

      var Acls = models.embed.util.helpers.mkInclude(Video.VideoACL);
      video.videoACL = video.acl;
      return Video.findById(id)
        .then(function(found) {
          if (!found) {
            return null;
          }
          return models.embed.update(Video, {
            id: id,
            videoACL: video.acl,
            name: video.name,
            description: video.description,
            privacy: video.privacy,
            channelId: video.channel,
          }, [Acls]);
        });
    }

    /**
     * Publishing video after all info is available
     * @param {string} id Video's id to publish
     * @param {Video} video Missing video's attributes
     */
    Video.publish = function(id, video) {
      if (video.privacy === 'public') {
        video.acl = [];
      }
      
      var Acls = models.embed.util.helpers.mkInclude(Video.VideoACL);
      video.videoACL = video.acl;
      return Video.find({
        where: {
          id: id,
          published: false,
        },
      }).then(function(found) {
        if (!found) {
          return null;
        }
        if (video.channel) {
          found.setChannel(video.channel);
        }
        return models.embed.update(Video, {
          id: id,
          videoACL: video.acl,
          name: video.name,
          description: video.description,
          privacy: video.privacy,
          published: true,
        }, [Acls]);
      })
    }

    Video.checkAuth = function(videoId, userId, groups) {
      return Video.count(Video.addAuthorizedFilter({
        where: {
          id: videoId,
        },
      }, userId, groups));
    };

    Video.getVideo = function(videoId) {
      return Video.findOne(Video.addAuthorizedFilter({
        attributes: [
          'id',
          'createdAt',
          'name',
          'description',
        ],
        where: {
          id: videoId,
        },
        include: [{
          model: models.Channel,
          as: 'channel',
          attributes: ['id', 'name'],
        }],
      })).then(function(video) {
        return Promise.all([
          Promise.resolve(video),
          video.countViews(),
          video.countLikes(),
          video.hasLike('s7591665'),
        ]);
      });
    }

    Video.viewVideo = function(id) {
      return Video.findById(id, {
        attributes: ['id'],
        include: [{
          model: models.Channel,
          attributes: ['id'],
          where: {
            id: 's7591665',
          },
          as: 'views',
          through: {
            attributes: ['createdAt'],
            where: {
              createdAt: {
                [Op.gt]: new Date(new Date() - 3 * 60 * 60 * 1000)
              }
            }
          },
        }],
      }).then(function(views) {
        // viewed 3 hours ago or less 
        if (views) { 
          return Promise.resolve();
        }
        return models.VideoView.create({
          VideoId: id,
          ChannelId: 's7591665', 
        });
      });
    }

    Video.likeVideo = function(id) {
      return Video.findById(id)
        .then(function(video) {
          return video.addLike('s7591665');
        });
    }

    Video.dislikeVideo = function(id) {
      return Video.findById(id)
        .then(function(video) {
          return video.removeLike('s7591665');
        });
    }

    Video.getFilterOrder = function(sort) {
      switch(sort) {
        // by create/publish date
        case 'new':
          return [
            ['createdAt', 'DESC'],
          ];
        // by most recent view
        case 'trending':
          // TODO
        // by views
        case 'top':
          // TODO
        case 'random':
        default:
          return sequelize.random();
      }
    };

    Video.getVideos =  function(limit, offset, sort) {
      return Video.findAll(Video.addAuthorizedFilter({
        attributes: ['id', 'createdAt', 'name', 'description'],
        limit: limit,
        offset: offset,
        order: Video.getFilterOrder(sort),
        include: [{
          model: models.Channel,
          as: 'channel',
          attributes: ['id', 'name'],
        }],
      }));
    };
  }

  return Video;
};

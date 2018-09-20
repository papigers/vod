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
      authorizedManage: function(userId, groups) {
        var userId = userId || 's7591665';
        var groups = groups || [];
        return {
          where: {
            [Op.or]: [{
                channelId: userId,
              }, {
                '$channel.channelACL.access$': 'MANAGE',
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
          },
          include: [{
            model: sequelize.models.Channel,
            as: 'channel',
            required: false,
            attributes: [],
            include: [{
              model: sequelize.models.ChannelAccess,
              as: 'channelACL',
              attributes: [],
              required: false,
            }],
          }],
        };
      },
      authorizedView: function(userId, groups) {
        var userId = userId || 's7591665';
        var groups = groups || [];
        return {
          where: {
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
          },
          include: [{
            model: sequelize.models.VideoAccess,
            as: 'videoACL',
            required: false,
            attributes: [],
            duplicating: false, // pg sequelize bug: https://github.com/sequelize/sequelize/issues/8432
          }, {
            model: sequelize.models.Channel,
            as: 'channel',
            required: false,
            attributes: ['id', 'name'],
            include: [{
              model: sequelize.models.ChannelAccess,
              as: 'channelACL',
              attributes: [],
              duplicating: false, // pg sequelize bug: https://github.com/sequelize/sequelize/issues/8432
              required: false,
            }],
          }],
        };
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
    Video.belongsToMany(models.Channel, {
      as: 'comments',
      through: {
        model: models.Comment,
        unique: false,
      },
    });
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
    Video.authorizedManage = function(userId, groups) {
      return { method: ['authorizedManage', userId, groups] };
    }
    Video.authorizedView = function(userId, groups) {
      return { method: ['authorizedView', userId, groups] };
    }

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

      return Video.scope(Video.authorizedManage(null, null)).findById(id)
        .then(function(found) {
          if (!found) {
            return null;
          }
          video.channelId = video.channel || found.get('channelId');
          var Acls = models.embed.util.helpers.mkInclude(Video.VideoACL);
          return models.embed.update(Video.scope(Video.authorizedManage(null, null)), {
            id: id,
            videoACL: video.acl,
            name: video.name,
            description: video.description,
            privacy: video.privacy,
            published: video.published,
            channelId: video.channelId,
          }, [Acls]);
        });
    }

    /**
     * Publishing video after all info is available
     * @param {string} id Video's id to publish
     * @param {Video} video Missing video's attributes
     */
    Video.publish = function(id, video) {
      video.published = true;
      return Video.edit(id, video);
    }

    Video.delete = function(id) {
      return Video.scope(Video.authorizedManage(null, null)).findById(id)
        .then(function(video) {
          if (video) {
            return video.destroy().then(function() {
              return true;
            });
          }
          return false;
        });
    }

    Video.checkAuth = function(videoId, userId, groups) {
      return Video.scope(Video.authorizedView(userId, groups)).count({
        where: {
          id: videoId,
        },
      });
    };

    Video.getVideo = function(videoId) {
      return Video.scope(Video.authorizedView(null, null)).findOne({
        attributes: [
          'id',
          'createdAt',
          'name',
          'description',
          'channelId',
        ],
        where: {
          id: videoId,
        },
      }).then(function(video) {
        return Promise.all([
          video,
          video.getChannel({
            attributes: ['id', 'name'],
          }),
          video.countViews(),
          video.countLikes(),
          video.hasLike('s7591665'),
        ]);
      });
    }

    Video.viewVideo = function(id) {
      return Video.scope(Video.authorizedView(null, null)).findById(id, {
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
      return Video.scope(Video.authorizedView(null, null)).findById(id)
        .then(function(video) {
          return video.addLike('s7591665');
        });
    }

    Video.dislikeVideo = function(id) {
      return Video.scope(Video.authorizedView(null, null)).findById(id)
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
          return [
            [sequelize.random()],
          ];
      }
    };

    Video.getVideos = function(limit, offset, sort) {
      return Video.scope(Video.authorizedView(null, null)).findAll({
        attributes: ['id', 'createdAt', 'name', 'description', 'channelId'],
        limit: limit,
        offset: offset,
        order: Video.getFilterOrder(sort),
      }).then(function(videos) {
        return Promise.all(videos.map(function(video) {
          return Promise.all([video, video.getChannel({
            attributes: ['id', 'name'],
          }), video.countViews()]);
        }));
      });
    };

    Video.getComments = function(videoId, offset) {
      return Video.scope(Video.authorizedView(null, null)).findById(videoId)
        .then(function(video) {
          return video.getComments({
            scope: models.Channel.authorizedView(null, null),
            offset,
            attributes: ['id', 'name'],
            order: [[sequelize.col('Comment.createdAt'), 'DESC']],
            raw: true,
          });
        });
    }

    Video.postComment = function(videoId, comment) {
      return Video.scope(Video.authorizedView(null, null)).findById(videoId)
        .then(function(video) {
          return models.Comment.create({
            ChannelId: 's7591665',
            VideoId: videoId,
            comment,
          });
        });
    }
  }

  return Video;
};

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
      authorizedManage: function(user) {
        var userId = user && user.id
        var groups = user && user.groups || [];
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
      authorizedView: function(user) {
        var userId = user && user.id
        var groups = user && user.groups || [];
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
    Video.VideoACLs = Video.hasMany(models.VideoAccess, {
      as: 'videoACL',
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
      },
    });
    Video.VideoTags = Video.belongsToMany(models.Tag, {
      through: {
        model: models.ItemTag,
        unique: false,
        scope: {
          taggable: 'video',
        },
      },
      foreignKey: 'itemId',
      // constraints: false,
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
    Video.authorizedManage = function(user) {
      return { method: ['authorizedManage', user] };
    }
    Video.authorizedView = function(user) {
      return { method: ['authorizedView', user] };
    }

    /**
     * 
     * @param {Object} video - the video to create
     * @param {string} creator - the channel id of the video's creator
     * @param {string} channel - video's channel id
     * @param {string} name - video's initial name: file name
     * @returns {Promise} Video creation promise
     */
    Video.initialCreate = function(user, video) {
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
    Video.edit = function(user, id, video) {
      if (video.privacy === 'public') {
        video.acl = [];
      }

      return sequelize.transaction(function(transaction) {
        return Video.scope(Video.authorizedManage(user)).findById(id, { transaction })
          .then(function(found) {
            if (!found) {
              return null;
            }
            video.channelId = video.channel || found.get('channelId');
            var Acls = models.embed.util.helpers.mkInclude(Video.VideoACLs);
            return models.embed.update(Video.scope(Video.authorizedManage(user)), {
              id: id,
              videoACL: video.acl,
              name: video.name,
              description: video.description,
              privacy: video.privacy,
              published: video.published,
              channelId: video.channelId,
            }, [Acls], { transaction })
          }).then(function(updated) {
            if (!updated) {
              return updated;
            }
            return Promise.all(video.tags.map(function(tag) {
              return models.Tag.findOrCreate({
                where: {
                  name: tag,
                },
                transaction,
              });
            })).then(function() {
              return updated;
            });
          }).then(function(updated) {
            return updated.setTags(video.tags, {
              transaction,
            }).then(function() {
              return sequelize.query('DELETE FROM "Tags" WHERE NOT EXISTS (SELECT 1 FROM "ItemTags" WHERE "ItemTags"."tagId" = "Tags".name)', {
                type: sequelize.QueryTypes.DELETE,
                transaction,
              });
            }).then(function() {
              return Promise.all([updated.get({ plain: true }), updated.getTags()]);
            });
          })
          .then(function([updated, tags]) {
            updated.tags = tags.map(function(tag) {
              return tag.get('name');
            });
            return updated;
          });
      });
    }

    /**
     * Publishing video after all info is available
     * @param {string} id Video's id to publish
     * @param {Video} video Missing video's attributes
     */
    Video.publish = function(user, id, video) {
      video.published = true;
      return Video.edit(user, id, video);
    }

    Video.delete = function(user, id) {
      return Video.scope(Video.authorizedManage(user)).findById(id)
        .then(function(video) {
          if (video) {
            return video.destroy().then(function() {
              return true;
            });
          }
          return false;
        });
    }

    Video.checkAuth = function(videoId, user) {
      return Video.scope(Video.authorizedView(user)).count({
        where: {
          id: videoId,
        },
      });
    };

    Video.getVideo = function(user, videoId) {
      return Video.scope(['defaultScope', Video.authorizedView(user)]).findOne({
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
        if (!video) {
          return [null];
        }
        return video.getChannel({
          attributes: ['id', 'name'],
        }).then(function(channel) {
          return Promise.all([
            video,
            channel,
            video.countViews(),
            video.countLikes(),
            video.hasLike(user && user.id),
            channel.hasFollower(user && user.id),
          ]);
        })
      });
    }

    Video.viewVideo = function(user, id) {
      return Video.scope(['defaultScope', Video.authorizedView(user)]).findById(id, {
        attributes: ['id'],
        include: [{
          model: models.Channel,
          attributes: ['id'],
          where: {
            id: user && user.id,
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
          ChannelId: user && user.id, 
        });
      });
    }

    Video.likeVideo = function(user, id) {
      return Video.scope(Video.authorizedView(user)).findById(id)
        .then(function(video) {
          return video.addLike(user && user.id);
        });
    }

    Video.dislikeVideo = function(user, id) {
      return Video.scope(Video.authorizedView(user)).findById(id)
        .then(function(video) {
          return video.removeLike(user && user.id);
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

    Video.getVideos =  function(user, limit, offset, sort) {
      return Video.scope(['defaultScope', Video.authorizedView(user)]).findAll({
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
  }

  return Video;
};

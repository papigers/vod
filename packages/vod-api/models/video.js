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
    // thumbnail: DataTypes.STRING,
    // poster: DataTypes.STRING,
    privacy: {
      type: DataTypes.ENUM(['public', 'private', 'channel']),
      defaultValue: 'private',
    },
  });

  Video.setClassMethods = function(models) {
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
        },
        defaults: {
          channelId: video.channel,
          creatorId: video.creator,
          name: video.name,
        },
      });
    }

    /**
     * editting video after all info is available
     * @param {string} id Video's id to publish
     * @param {Video} video video's attributes
     */
    Video.edit = function(id, video) {
      return Video.update(video, {
        fields: ['name', 'description', 'privacy', 'acl'],
        where: {
          id,
        },
      });
    }

    /**
     * Publishing video after all info is available
     * @param {string} id Video's id to publish
     * @param {Video} video Missing video's attributes
     */
    Video.publish = function(id, video) {
      video.published = true;
      return Video.update(video, {
        fields: ['name', 'description', 'published', 'privacy', 'acl'],
        where: {
          id,
          published: false,
        },
      });
    }

    Video.checkAuth = function(videoId, userId, groups) {
      return new Promise(function(resolve, reject) {
        var querysMade = 0;
        var realResolve = function (video) {
          querysMade++;
          if (!!video) {
            resolve(video);
          }
          else if (querysMade === 3) {
            resolve(video);
          }
        }
        Video.findOne({
          where: {
            id: videoId,
            [Op.or]: [{
              channelId: userId,
            }, {
              privacy: 'public',
            },
          ]},
        }).then(realResolve).catch(reject);

        Video.findOne({
          where: {
            id: videoId,
            privacy: 'private',
          },
          include: [{
            model: models.VideoAccess,
            as: 'acl',
            where: {
              [Op.or]: [
                {
                  id: userId,
                  type: 'USER',
                },
                {
                  id: {
                    [Op.in]: groups || [],
                  },
                  type: 'AD_GROUP',
                },
              ],
            },
          }],
        }).then(realResolve).catch(reject);

        Video.findOne({
          where: {
            id: videoId,
            privacy: 'channel',
          },
          include: [{
            model: models.Channel,
            as: 'channel',
            include: [{
              model: models.ChannelAccess,
              as: 'acl',
              where: {
                [Op.or]: [
                  {
                    id: userId,
                    type: 'USER',
                  },
                  {
                    id: {
                      [Op.in]: groups || [],
                    },
                    type: 'AD_GROUP',
                  },
                ],
              },
            }],
          }],
        }).then(realResolve).catch(reject);
      });
    };
  }

  Video.associate = function(models) {
    Video.hasMany(models.VideoAccess, { as: 'acl' });
    // Video.belongsToMany(models.Channel, { as: 'likes' });
    // Video.belongsToMany(models.Channel, { as: 'views' });
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

  return Video;
};

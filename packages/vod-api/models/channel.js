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
    Channel.hasMany(models.ChannelAccess, { as: 'channelACL' });
  };

  return Channel;
};

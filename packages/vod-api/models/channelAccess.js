module.exports = function(sequelize, DataTypes) {
  var ChannelAccess = sequelize.define('ChannelAccess', {
    access: DataTypes.ENUM('VIEW', 'MANAGE'),
    type: DataTypes.ENUM(['USER', 'AD_GROUP']),
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    ChannelId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  });

  return ChannelAccess;
};

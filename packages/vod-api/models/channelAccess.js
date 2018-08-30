module.exports = function(sequelize, DataTypes) {
  var ChannelAccess = sequelize.define('ChannelAccess', {
    access: DataTypes.ENUM('VIEW', 'POST'),
    type: DataTypes.ENUM(['USER', 'AD_GROUP']),
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  });

  return ChannelAccess;
};

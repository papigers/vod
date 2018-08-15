module.exports = function(sequelize, DataTypes) {
  var ChannelAccess = sequelize.define('ChannelAccess', {
    access: DataTypes.ENUM('VIEW', 'POST'),
    type: DataTypes.ENUM(['USER', 'AD_GROUP', 'ALL']),
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  });

  return ChannelAccess;
};

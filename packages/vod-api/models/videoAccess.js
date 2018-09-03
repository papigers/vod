module.exports = function(sequelize, DataTypes) {
  var VideoAccess = sequelize.define('VideoAccess', {
    type: DataTypes.ENUM(['USER', 'AD_GROUP']),
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    VideoId: {
      type: DataTypes.CHAR(12),
      primaryKey: true,
    },
  });

  return VideoAccess;
};

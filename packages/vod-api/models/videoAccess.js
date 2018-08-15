module.exports = function(sequelize, DataTypes) {
  var VideoAccess = sequelize.define('VideoAccess', {
    type: DataTypes.ENUM(['USER', 'AD_GROUP']),
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  });

  return VideoAccess;
};

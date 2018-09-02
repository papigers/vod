module.exports = function(sequelize, DataTypes) {
  var VideoView = sequelize.define('VideoView', {
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      primaryKey: true,
    },
  }, {
    timestamps: true,
    updatedAt: false,
  });

  return VideoView;
};

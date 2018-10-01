module.exports = function(sequelize, DataTypes) {
  var Tag = sequelize.define('Tag', {
    name: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  });

  Tag.associate = function(models) {
    Tag.belongsToMany(models.Video, {
      through: {
        model: models.ItemTag,
        unique: false,
      },
      foreignKey: 'tagId',
      // constraints: false,
    });
  };

  return Tag;
};

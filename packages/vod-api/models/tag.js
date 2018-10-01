module.exports = function(sequelize, DataTypes) {
  var Tag = sequelize.define('Tag', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  });

  Tag.associate = function(models) {
    Tag.belongsToMany(models.Video, {
      as: 'items',
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

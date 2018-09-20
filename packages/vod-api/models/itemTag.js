module.exports = function(sequelize, DataTypes) {
  var ItemTag = sequelize.define('ItemTag', {
    tagId: {
      type: DataTypes.STRING,
      unique: 'item_tag_taggable',
      primaryKey: true,
    },
    taggable: {
      type: DataTypes.STRING,
      unique: 'item_tag_taggable',
    },
    itemId: {
      type: DataTypes.STRING,
      unique: 'item_tag_taggable',
      primaryKey: true,
      references: null,
    },
  });

  return ItemTag;
};

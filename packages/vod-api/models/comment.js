module.exports = function(sequelize, DataTypes) {
  var Comment = sequelize.define('Comment', {
    content: DataTypes.STRING,
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  });

  return Comment;
};

var nanoid = require('nanoid');

module.exports = function(sequelize, DataTypes) {
  var Comment = sequelize.define('Comment', {
    content: DataTypes.STRING,
    id: {
      type: DataTypes.INTEGER,
      defaultValue: nanoid.bind(this, 10),
      primaryKey: true,
    },
  });

  return Comment;
};

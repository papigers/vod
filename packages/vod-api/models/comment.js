var nanoid = require('nanoid');

module.exports = function(sequelize, DataTypes) {
  var Comment = sequelize.define('Comment', {
    comment: DataTypes.STRING,
    id: {
      type: DataTypes.CHAR(10),
      defaultValue: nanoid.bind(this, 10),
      primaryKey: true,
    },
  });

  return Comment;
};

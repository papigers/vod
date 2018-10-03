module.exports = function() {
  var comments = function Comment() {
    if (!(this instanceof Comment)) {
      return new Comment();
    }
  }

  comments.table = 'comments';
  comments.attributes = {
    comment: {
      type: 'string',
      notNullable: true,
    },
    id: {
      type: 'char',
      length: 10,
      primaryKey: true,
      notNullable: true,
    },
    channelId: {
      type: 'string',
      notNullable: true,
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    videoId: {
      type: 'char',
      length: 12,
      notNullable: true,
      references: {
        column: 'id',
        table: 'videos',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
  };
  comments.createdAt = true;
  comments.updatedAt = true;

  return comments;
};

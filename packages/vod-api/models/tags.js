module.exports = function() {
  var tags = function Tag() {
    if (!(this instanceof Tag)) {
      return new Tag();
    }
  }

  tags.table = 'tags';
  tags.attributes = {
    tag: {
      type: 'string',
      primaryKey: true,
      notNullable: true,
    },
    taggable: {
      type: 'enu',
      values: ['VIDEO'],
      notNullable: true,
    },
    itemId: {
      type: 'char',
      length: 12,
      primaryKey: true,
      notNullable: true,
    },
  };
  tags.indices = [
    { type: 'unique', columns: ['tag', 'taggable', 'itemId']},
  ];
  tags.createdAt = true;
  tags.updatedAt = true;

  return tags;
};

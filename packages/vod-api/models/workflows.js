var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 16);

module.exports = function(db) {
  var workflows = function Subscribtion() {
    if (!(this instanceof Subscribtion)) {
      return new Subscribtion();
    }
  };

  workflows.table = 'workflows';
  workflows.generateId = generateId;
  workflows.attributes = {
    id: {
      type: 'char',
      length: 16,
      primaryKey: true,
      notNullable: true,
    },
    type: {
      type: 'enu',
      values: ['CREATE_CHANNEL', 'CREATE_SUBSCRIPTION'],
      notNullable: true,
    },
    currentStep: {
      type: 'smallint',
      default: 0,
      notNullable: true,
    },
    requester: {
      type: 'string',
      notNullable: true,
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    subject: {
      type: 'string',
      notNullable: true,
    },
    secondarySubject: {
      type: 'string',
    },
  };
  workflows.createdAt = true;
  workflows.updatedAt = true;

  return workflows;
};

var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 16);

module.exports = function(db) {
  var subscriptions = function Subscription() {
    if (!(this instanceof Subscription)) {
      return new Subscription();
    }
  };

  subscriptions.table = 'subscriptions';
  subscriptions.generateId = generateId;
  subscriptions.attributes = {
    id: {
      type: 'char',
      length: 16,
      primaryKey: true,
      notNullable: true,
    },
    planId: {
      type: 'string',
      notNullable: true,
      default: 'free',
      references: {
        column: 'id',
        table: 'plans',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    channelId: {
      type: 'string',
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    verified: {
      type: 'boolean',
      default: false,
    },
    emf: {
      type: 'string',
    },
    from: {
      type: 'date',
      // notNullable: true,
    },
    to: {
      type: 'date',
      // notNullable: true,
    },
  };
  subscriptions.createdAt = true;
  subscriptions.updatedAt = false;

  subscriptions.getInitialSubscription = function getInitialSubscription(subId) {
    if (!subId) {
      return db.knex
        .select('id')
        .from(subscriptions.table)
        .where('planId', 'free')
        .whereNull('channelId')
        .limit(1)
        .first();
    }
    return db.knex
      .select('id')
      .from(subscriptions.table)
      .where('id', subId)
      .whereNull('channelId')
      .first();
  };

  return subscriptions;
};

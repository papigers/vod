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
        onDelete: 'set default',
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

  subscriptions.getGlobalSubscription = function getGlobalSubscription() {
    return db.knex
      .select(`${db.plans.table}.*`)
      .select(`${subscriptions.table}.id as subscription`)
      .from(db.plans.table)
      .leftJoin(subscriptions.table, function() {
        this.on(`${subscriptions.table}.planId`, `${db.plans.table}.id`).on(
          db.knex.raw('? <= ?', [
            db.knex
              .count('id')
              .from(subscriptions.table)
              .where('planId', `${db.plans.table}.id`),
            1,
          ]),
        );
      })
      .where(`${db.plans.table}.id`, '<>', 'personal')
      .orderBy([`${db.plans.table}.price`, `${db.plans.table}.sizeQuota`]);
  };

  subscriptions.getInitialSubscription = function getInitialSubscription() {
    return db.knex
      .select('id')
      .from(subscriptions.table)
      .where('planId', 'free')
      .whereNull('channelId')
      .limit(1)
      .first();
  };

  return subscriptions;
};

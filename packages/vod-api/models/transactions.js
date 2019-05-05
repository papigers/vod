var nanoid = require('nanoid');

var generateId = nanoid.bind(this, 12);

module.exports = function(db) {
  var transactions = function Transaction() {
    if (!(this instanceof Transaction)) {
      return new Transaction();
    }
  };

  transactions.table = 'transactions';
  transactions.generateId = generateId;
  transactions.attributes = {
    id: {
      type: 'char',
      length: 12,
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
    emf: {
      type: 'string',
    },
    amount: {
      type: 'integer',
      notNullable: true,
    },
    type: {
      type: 'enu',
      values: ['LOAD_CREDIT', 'CREATE_SUBSCRIPTION'],
      notNullable: true,
    },
    subject: {
      type: 'string',
      notNullable: false,
    },
    verified: {
      type: 'boolean',
      default: false,
    },
  };
  transactions.createdAt = true;
  transactions.updatedAt = true;

  transactions.getChannelBalance = function getChannelBalance(id, user) {
    return db.knex
      .select(db.knex.raw(`coalesce(sum(${db.transactions.table}.amount), 0) as balance`))
      .from(transactions.table)
      .where(`${transactions.table}.channelId`, id)
      .where(`${transactions.table}.verified`, true)
      .leftJoin(db.channels.table, `${transactions.table}.channelId`, `${db.channels.table}.id`)
      .modify(db.channels.authorizedManageSubquery, user)
      .first();
  };

  transactions.getChannelBalanceUnverified = function getChannelBalanceUnverified(id, user) {
    return db.knex
      .select(db.knex.raw(`coalesce(sum(${db.transactions.table}.amount), 0) as balance`))
      .from(transactions.table)
      .where(`${transactions.table}.channelId`, id)
      .where(`${transactions.table}.verified`, false)
      .leftJoin(db.channels.table, `${transactions.table}.channelId`, `${db.channels.table}.id`)
      .modify(db.channels.authorizedManageSubquery, user)
      .first();
  };

  transactions.getBalanceReport = function getBalanceReport(user) {
    return db.knexnest(
      db.knex
        .select(
          `${transactions.table}.id as _id`,
          `${transactions.table}.channelId as _channelId`,
          `${transactions.table}.amount as _amount`,
          `${transactions.table}.type as _type`,
          `${transactions.table}.subject as _subject_id`,
          `${transactions.table}.emf as _emf`,
          `${transactions.table}.updatedAt as _updatedAt`,
          `${db.subscriptions.table}.channelId as _subject_channel_id`,
          `${db.channels.table}.name as _subject_channel_name`,
        )
        .from(transactions.table)
        .leftJoin(db.subscriptions.table, function() {
          this.on(`${transactions.table}.type`, db.knex.raw('?', ['CREATE_SUBSCRIPTION'])).on(
            `${transactions.table}.subject`,
            `${db.subscriptions.table}.id`,
          );
        })
        .leftJoin(
          db.channels.table,
          `${db.channels.table}.id`,
          `${db.subscriptions.table}.channelId`,
        )
        .where(`${transactions.table}.channelId`, user && user.id)
        .orderBy(`${transactions.table}.updatedAt`, 'asc'),
    );
  };

  transactions.loadCredit = function loadCredit(trans, user) {
    return db.knex.transaction(function(trx) {
      var transId = generateId();
      return trx(transactions.table)
        .insert({
          id: transId,
          channelId: user && user.id,
          emf: trans.emf,
          amount: trans.amount,
          type: 'LOAD_CREDIT',
        })
        .then(function() {
          return trx(db.workflows.table)
            .insert({
              id: db.workflows.generateId(),
              type: 'LOAD_CREDIT',
              requester: user && user.id,
              subject: transId,
            })
            .returning('id');
        })
        .then(function(ids) {
          return trx(db.workflowActivities.table)
            .insert({
              id: db.workflowActivities.generateId(),
              workflowId: ids[0],
              name: 'KETER',
            })
            .then(function() {
              return ids[0];
            });
        });
    });
  };

  transactions.buySubscription = function buySubscription(channel, plan, user) {
    return Promise.all([
      db.channels.getChannelSubscriptions(channel, user),
      transactions.getChannelBalance(user && user.id, user),
    ]).then(function([subRes, balanceRes]) {
      var currentSub = subRes[0].subscription;
      var discount = 0;
      if (currentSub.plan.price > 0) {
        currentSub.from = new Date(currentSub.from);
        currentSub.to = new Date(currentSub.to);
        discount = Math.ceil(
          ((currentSub.to - new Date()) / (currentSub.to - currentSub.from)) *
            currentSub.plan.price,
        );
      }
      var price = -Math.max(0, plan.price - discount);
      var balance = balanceRes.balance;
      if (balance < -price) {
        throw new Error('Not enough credit balance');
      }
      var start = new Date();
      start.setMilliseconds(0);
      start.setSeconds(0);
      start.setMinutes(0);
      start.setHours(0);
      var end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      return db.knex.transaction(function(trx) {
        return trx(db.subscriptions.table)
          .insert({
            from: start,
            to: end,
            channelId: channel,
            planId: plan.id,
            id: db.subscriptions.generateId(),
          })
          .returning('id')
          .then(function(subId) {
            var transId = generateId();
            return trx(transactions.table)
              .insert({
                id: transId,
                channelId: user && user.id,
                amount: price,
                type: 'CREATE_SUBSCRIPTION',
                subject: subId[0],
                verified: true,
              })
              .then(function() {
                return trx(db.subscriptions.table)
                  .update('to', start)
                  .whereNotIn('planId', ['free', 'test', 'personal'])
                  .whereIn('id', function() {
                    this.select(`${db.channels.table}.activeSubscriptionId`)
                      .from(db.channels.table)
                      .where(`${db.channels.table}.id`, channel);
                  });
              })
              .then(function() {
                return trx(db.channels.table)
                  .update('activeSubscriptionId', subId[0])
                  .where('id', channel);
              });
          });
      });
    });
  };

  return transactions;
};

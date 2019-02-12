module.exports = function(db) {
  var plans = function Plan() {
    if (!(this instanceof Plan)) {
      return new Plan();
    }
  };

  plans.table = 'plans';
  plans.attributes = {
    id: {
      type: 'string',
      primaryKey: true,
      notNullable: true,
    },
    name: {
      type: 'string',
      unique: true,
    },
    sizeQuota: {
      type: 'integer',
    },
    videoQuota: {
      type: 'smallint',
    },
    price: {
      type: 'float',
      notNullable: true,
    },
  };
  plans.createdAt = false;
  plans.updatedAt = false;

  plans.getAvailablePlans = function getAvailablePlans() {
    return db.knexnest(
      db.knex
        .select(
          `${plans.table}.id as _id`,
          `${plans.table}.name as _name`,
          `${plans.table}.sizeQuota as _sizeQuota`,
          `${plans.table}.videoQuota as _videoQuota`,
          `${plans.table}.price as _price`,
          `${db.subscriptions.table}.id as _subscription`,
        )
        .from(plans.table)
        .leftJoin(db.subscriptions.table, function() {
          this.on(`${plans.table}.id`, `${db.subscriptions.table}.planId`).on(
            db.knex.raw('? >= ??', [
              1,
              function() {
                this.count('id')
                  .from(db.subscriptions.table)
                  .whereRaw('?? = ??', [`${plans.table}.id`, `${db.subscriptions.table}.planId`])
              },
            ]),
          );
        })
        .where(`${plans.table}.id`, '<>', 'personal')
        .orderBy(`${plans.table}.price`),
    );
  };

  return plans;
};

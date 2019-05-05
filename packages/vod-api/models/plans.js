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
      notNullable: true,
      primaryKey: true,
    },
    name: {
      type: 'string',
      notNullable: true,
    },
    sizeQuota: {
      type: 'integer',
      notNullable: true,
    },
    videoQuota: {
      type: 'integer',
      notNullable: false,
    },
    price: {
      type: 'integer',
      notNullable: true,
      default: 0,
    },
  };
  plans.createdAt = false;
  plans.updatedAt = false;

  return plans;
};

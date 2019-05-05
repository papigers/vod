var nanoid = require('nanoid');
var config = require('config');
var ldap = require('../routes/ldap');

var generateId = nanoid.bind(this, 16);

module.exports = function(db) {
  var workflows = function Workflow() {
    if (!(this instanceof Workflow)) {
      return new Workflow();
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
      values: ['CREATE_CHANNEL', 'LOAD_CREDIT'],
      notNullable: true,
    },
    // state: {
    //   type: 'enu',
    //   values: ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'TIMEOUT', 'CANCELED'],
    //   notNullable: true,
    //   default: 'IN_PROGRESS',
    // },
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
  };
  workflows.createdAt = true;
  workflows.updatedAt = true;

  workflows.getWorkflowKabamScope = function getWorkflowKabamScope(user) {
    var groups = (user && user.groups) || [];
    var managedOrgs = groups
      .filter(function(group) {
        return group.match(/^CN=ggd-.{4,}-.{4,}-Kabam/i);
      })
      .map(function(group) {
        var groups = group.match(/^CN=ggd-(?<top>.{4,})-(?<bot>.{4,})-Kabam,/i).groups;
        return `ou=ouU-${groups.bot},ou=ouU-${groups.top},${config.ad.baseDN}`;
      });
    return Promise.all(
      managedOrgs.map(function(org) {
        return ldap.getOrgUsers(org);
      }),
    )
      .then(function(allUsersArr) {
        return [
          ...new Set(
            allUsersArr.reduce(function(allArr, currArr) {
              return allArr.concat(currArr);
            }, []),
          ),
        ].map(function(user) {
          return user.sAMAccountName;
        });
      })
      .then(function(users) {
        return {
          scope: 'KABAM',
          users,
        };
      });
  };

  workflows.getWorkflowKeterScope = function getWorkflowKeterScope(user) {
    var groups = (user && user.groups) || [];
    var isKeter =
      groups.findIndex(function(group) {
        return group === 'CN=Keter,OU=org1,OU=orgs,DC=example,DC=com';
      }) !== -1;
    return {
      scope: 'KETER',
      users: isKeter ? '*' : [],
    };
  };

  workflows.withLastActivity = function withLastActivity(queryBuilder) {
    return queryBuilder.leftJoin(`${db.workflowActivities.table} as lastActivity`, function() {
      this.on(`lastActivity.workflowId`, `${workflows.table}.id`)
        .onIn(
          'lastActivity.step',
          db.knex
            .max('step')
            .from(db.workflowActivities.table)
            .where('workflowId', db.knex.raw('??', [`${workflows.table}.id`])),
        )
        .onIn(
          'lastActivity.createdAt',
          db.knex
            .max('createdAt')
            .from(db.workflowActivities.table)
            .where('workflowId', db.knex.raw('??', [`${workflows.table}.id`])),
        );
    });
  };

  workflows.getWorkflow = function getWorkflow(user, id) {
    return db.knexnest(
      db.knex
        .select(
          `${workflows.table}.id as _id`,
          `${workflows.table}.type as _type`,
          `${workflows.table}.createdAt as _createdAt`,
          `lastActivity.updatedAt as _updatedAt`,
          `lastActivity.state as _state`,
          `${db.workflowActivities.table}.id as _steps__id`,
          `${db.workflowActivities.table}.step as _steps__step`,
          `${db.workflowActivities.table}.state as _steps__state`,
          `${db.workflowActivities.table}.name as _steps__name`,
          `${db.workflowActivities.table}.comment as _steps__comment`,
          `${db.workflowActivities.table}.updatedAt as _steps__updatedAt`,
          `responder.id as _steps__responder_id`,
          `responder.name as _steps__responder_name`,
          `requester.id as _requester_id`,
          `requester.name as _requester_name`,
          `requester.description as _requester_description`,
          `${db.channels.table}.id as _channel_id`,
          `${db.channels.table}.name as _channel_name`,
          `${db.channels.table}.description as _channel_description`,
          `${db.subscriptions.table}.id as _subscription_id`,
          `${db.plans.table}.id as _subscription_plan_id`,
          `${db.plans.table}.name as _subscription_plan_name`,
          `${db.plans.table}.price as _subscription_plan_price`,
          `${db.plans.table}.sizeQuota as _subscription_plan_sizeQuota`,
          `${db.plans.table}.videoQuota as _subscription_plan_videoQuota`,
          `${db.transactions.table}.id as _transaction_id`,
          `${db.transactions.table}.amount as _transaction_amount`,
          `${db.transactions.table}.emf as _transaction_emf`,
        )
        .from(db.workflows.table)
        .leftJoin(
          `${db.channels.table} as requester`,
          'requester.id',
          `${workflows.table}.requester`,
        )
        .leftJoin(db.channels.table, function() {
          this.on(`${db.channels.table}.id`, `${workflows.table}.subject`).onIn(
            `${workflows.table}.type`,
            ['CREATE_CHANNEL'],
          );
        })
        .leftJoin(
          db.subscriptions.table,
          `${db.subscriptions.table}.id`,
          `${db.channels.table}.activeSubscriptionId`,
        )
        .leftJoin(db.plans.table, `${db.subscriptions.table}.planId`, `${db.plans.table}.id`)
        .leftJoin(db.transactions.table, function() {
          this.on(`${db.transactions.table}.id`, `${workflows.table}.subject`).onIn(
            `${workflows.table}.type`,
            ['LOAD_CREDIT'],
          );
        })
        .leftJoin(
          db.workflowActivities.table,
          `${db.workflowActivities.table}.workflowId`,
          `${workflows.table}.id`,
        )
        .leftJoin(
          `${db.channels.table} as responder`,
          `${db.workflowActivities.table}.responder`,
          `responder.id`,
        )
        .modify(workflows.withLastActivity)
        .where(`${workflows.table}.id`, id)
        .orderBy(`${db.workflowActivities.table}.createdAt`, 'asc'),
      true,
    );
  };

  workflows.getUserRequestedWorkflows = function getUserRequestedWorkflows(
    user,
    limit,
    offset,
    type,
  ) {
    var query = db.knex
      .select(
        `${workflows.table}.id as _id`,
        `${workflows.table}.type as _type`,
        `${workflows.table}.createdAt as _createdAt`,
        `${workflows.table}.updatedAt as _updatedAt`,
        `lastActivity.id as _lastStep_id`,
        `lastActivity.step as _lastStep_step`,
        `lastActivity.state as _lastStep_state`,
        `lastActivity.name as _lastStep_name`,
        `lastActivity.comment as _lastStep_comment`,
        `${db.channels.table}.id as _channel_id`,
        `${db.subscriptions.table}.id as _subscription_id`,
        `${db.plans.table}.id as _subscription_plan_id`,
        `${db.plans.table}.name as _subscription_plan_name`,
        `${db.plans.table}.price as _subscription_plan_price`,
        `${db.plans.table}.sizeQuota as _subscription_plan_sizeQuota`,
        `${db.plans.table}.videoQuota as _subscription_plan_videoQuota`,
        `${db.transactions.table}.id as _transaction_id`,
        `${db.transactions.table}.amount as _transaction_amount`,
        `${db.transactions.table}.emf as _transaction_emf`,
      )
      .from(db.workflows.table)
      .leftJoin(db.channels.table, function() {
        this.on(`${db.channels.table}.id`, `${workflows.table}.subject`).onIn(
          `${workflows.table}.type`,
          ['CREATE_CHANNEL'],
        );
      })
      .leftJoin(
        db.subscriptions.table,
        `${db.subscriptions.table}.id`,
        `${db.channels.table}.activeSubscriptionId`,
      )
      .leftJoin(db.plans.table, `${db.subscriptions.table}.planId`, `${db.plans.table}.id`)
      .leftJoin(db.transactions.table, function() {
        this.on(`${db.transactions.table}.id`, `${workflows.table}.subject`).onIn(
          `${workflows.table}.type`,
          ['LOAD_CREDIT'],
        );
      })
      .modify(workflows.withLastActivity)
      .where('requester', user && user.id)
      .limit(limit)
      .offset(offset);
    if (type !== 'all') {
      let state = '';
      switch (type) {
        case 'inprogress':
          state = 'IN_PROGRESS';
          break;
        case 'approved':
          state = 'APPROVED';
          break;
        default:
      }
      query.where(`lastActivity.state`, state);
    }
    return db.knexnest(query, false);
  };

  function getScopedUserRequests(scope) {
    var query = db.knex
      .select(
        `${workflows.table}.id as _id`,
        `${workflows.table}.type as _type`,
        `${workflows.table}.createdAt as _createdAt`,
        `${workflows.table}.updatedAt as _updatedAt`,
        `lastActivity.id as _lastStep_id`,
        `lastActivity.step as _lastStep_step`,
        `lastActivity.state as _lastStep_state`,
        `lastActivity.name as _lastStep_name`,
        `lastActivity.comment as _lastStep_comment`,
        `requester.id as _requester_id`,
        `requester.name as _requester_name`,
        `${db.channels.table}.id as _channel_id`,
        `${db.subscriptions.table}.id as _subscription_id`,
        `${db.plans.table}.id as _subscription_plan_id`,
        `${db.plans.table}.name as _subscription_plan_name`,
        `${db.plans.table}.price as _subscription_plan_price`,
        `${db.plans.table}.sizeQuota as _subscription_plan_sizeQuota`,
        `${db.plans.table}.videoQuota as _subscription_plan_videoQuota`,
        `${db.transactions.table}.id as _transaction_id`,
        `${db.transactions.table}.amount as _transaction_amount`,
        `${db.transactions.table}.emf as _transaction_emf`,
      )
      .from(db.workflows.table)
      .leftJoin(db.channels.table, function() {
        this.on(`${db.channels.table}.id`, `${workflows.table}.subject`).onIn(
          `${workflows.table}.type`,
          ['CREATE_CHANNEL'],
        );
      })
      .leftJoin(
        db.subscriptions.table,
        `${db.subscriptions.table}.id`,
        `${db.channels.table}.activeSubscriptionId`,
      )
      .leftJoin(db.plans.table, `${db.subscriptions.table}.planId`, `${db.plans.table}.id`)
      .leftJoin(db.transactions.table, function() {
        this.on(`${db.transactions.table}.id`, `${workflows.table}.subject`).onIn(
          `${workflows.table}.type`,
          ['LOAD_CREDIT'],
        );
      })
      .leftJoin(`${db.channels.table} as requester`, 'requester.id', `${workflows.table}.requester`)
      .modify(workflows.withLastActivity)
      .where('lastActivity.name', scope.scope)
      .where('lastActivity.state', 'IN_PROGRESS');

    if (scope.users !== '*') {
      // query.whereIn('requester', scope.users || []); / / TODO: uncomment
    }

    return query;
  }

  workflows.getPendingRequests = function getPendingRequests(user, limit, offset) {
    var userScopes = [workflows.getWorkflowKabamScope(user), workflows.getWorkflowKeterScope(user)];
    return Promise.all(userScopes).then(function(scopes) {
      var queries = scopes.map(function(scope) {
        return getScopedUserRequests(scope);
      });
      var unionQuery = queries[0];
      if (queries.length > 1) {
        unionQuery.union(queries.slice(1), true);
      }
      return db.knexnest(unionQuery.limit(limit).offset(offset), true);
    });
  };

  return workflows;
};

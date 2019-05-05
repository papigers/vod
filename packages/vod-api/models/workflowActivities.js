var nanoid = require('nanoid');
var config = require('config');
var generateId = nanoid.bind(this, 16);

module.exports = function(db) {
  var workflowActivities = function WorkflowActivity() {
    if (!(this instanceof WorkflowActivity)) {
      return new WorkflowActivity();
    }
  };

  workflowActivities.table = 'workflowActivities';
  workflowActivities.generateId = generateId;
  workflowActivities.attributes = {
    id: {
      type: 'char',
      length: 16,
      primaryKey: true,
      notNullable: true,
    },
    workflowId: {
      type: 'char',
      length: 16,
      notNullable: true,
      references: {
        column: 'id',
        table: 'workflows',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    step: {
      type: 'smallint',
      default: 0,
      notNullable: true,
    },
    responder: {
      type: 'string',
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
      },
    },
    name: {
      type: 'string',
      notNullable: true,
    },
    state: {
      type: 'enu',
      values: ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'TIMEOUT', 'CANCELED'],
      notNullable: true,
      default: 'IN_PROGRESS',
    },
    comment: {
      type: 'string',
    },
  };
  workflowActivities.createdAt = true;
  workflowActivities.updatedAt = true;

  // workflowActivities.indices = [{ type: 'unique', columns: ['step', 'workflowId', 'responder'] }];

  workflowActivities.lastActivity = function lastActivity(queryBuilder, workflowId) {
    return queryBuilder
      .where(`${workflowActivities.table}.workflowId`, workflowId)
      .whereIn(
        'step',
        db.knex
          .max('step')
          .from(workflowActivities.table)
          .where('workflowId', workflowId),
      )
      .whereIn(
        `${workflowActivities.table}.createdAt`,
        db.knex
          .max(`${workflowActivities.table}.createdAt`)
          .from(workflowActivities.table)
          .where('workflowId', workflowId),
      );
  };

  workflowActivities.getLastActivity = function getLastActivity(workflowId) {
    return db.knex
      .select()
      .from(workflowActivities.table)
      .modify(workflowActivities.lastActivity, workflowId)
      .leftJoin(
        db.workflows.table,
        `${workflowActivities.table}.workflowId`,
        `${db.workflows.table}.id`,
      )
      .first();
  };

  workflowActivities.canApproveWorkflow = function canApproveWorkflow(user, workflowId) {
    return workflowActivities.getLastActivity(workflowId).then(function(activity) {
      if (activity) {
        if (activity.state !== 'IN_PROGRESS') {
          return {
            can: false,
            reason: 'Unable to approve a terminated workflow',
            activity,
          };
        }
        if (activity.name === 'KABAM') {
          return db.workflows.getWorkflowKabamScope(user).then(function(scope) {
            if (scope.users.indexOf(activity.requester) === -1) {
              return {
                can: false,
                reason: 'Not authorized to approve this workflow',
                activity,
              };
            }
            return {
              can: true,
              activity,
            };
          });
        }
      }
      return {
        can: false,
        reason: 'Not found',
        activity,
      };
    });
  };

  function approveCreateChannelWorkflow(user, workflow, message, lastActivity) {
    return db.knex.transaction(function(trx) {
      return trx(workflowActivities.table)
        .insert({
          id: generateId(),
          workflowId: workflow.id,
          step: lastActivity.step,
          name: lastActivity.name,
          state: 'APPROVED',
          comment: message,
          responder: user && user.id,
        })
        .then(function() {
          return trx(db.channels.table)
            .update('verified', true)
            .where('id', workflow.subject);
        });
    });
  }

  function approveLoadCreditWorkflow(user, workflow, message, lastActivity) {
    return db.knex.transaction(function(trx) {
      return trx(workflowActivities.table)
        .insert({
          id: generateId(),
          workflowId: workflow.id,
          step: lastActivity.step,
          name: lastActivity.name,
          state: 'APPROVED',
          comment: message,
          responder: user && user.id,
        })
        .then(function() {
          return trx(db.transactions.table)
            .update('verified', true)
            .where('id', workflow.subject);
        });
    });
  }

  workflowActivities.approveWorkflow = function approveWorkflow(
    user,
    workflowId,
    message,
    lastActivity,
  ) {
    var approveFunc = null;
    return db.knex
      .select()
      .from(db.workflows.table)
      .where('id', workflowId)
      .first()
      .then(function(workflow) {
        switch (workflow.type) {
          case 'CREATE_CHANNEL':
            approveFunc = approveCreateChannelWorkflow;
            break;
          case 'LOAD_CREDIT':
            approveFunc = approveLoadCreditWorkflow;
            break;
          default:
            throw new Error('Unknown workflow type');
        }
        return approveFunc(user, workflow, message, lastActivity);
      });
  };

  workflowActivities.canRejectWorkflow = function canRejectWorkflow(user, workflowId) {
    return workflowActivities.getLastActivity(workflowId).then(function(activity) {
      if (activity) {
        if (activity.state !== 'IN_PROGRESS') {
          return {
            can: false,
            reason: 'Unable to reject a terminated workflow',
            activity,
          };
        }
        if (activity.name === 'KABAM') {
          return db.workflows.getWorkflowKabamScope(user).then(function(scope) {
            if (scope.users !== '*' && scope.users.indexOf(activity.requester) === -1) {
              return {
                can: false,
                reason: 'Not authorized to reject this workflow',
                activity,
              };
            }
            return {
              can: true,
              activity,
            };
          });
        } else if (activity.name === 'KETER') {
          return db.workflows.getWorkflowKeterScope(user).then(function(scope) {
            if (scope.users !== '*' && scope.users.indexOf(activity.requester) === -1) {
              return {
                can: false,
                reason: 'Not authorized to reject this workflow',
                activity,
              };
            }
            return {
              can: true,
              activity,
            };
          });
        }
      }
      return {
        can: false,
        reason: 'Not found',
        activity,
      };
    });
  };

  workflowActivities.rejectWorkflow = function rejectWorkflow(
    user,
    workflowId,
    message,
    lastActivity,
  ) {
    return db.knex(workflowActivities.table).insert({
      id: generateId(),
      workflowId,
      step: lastActivity.step,
      name: lastActivity.name,
      state: 'REJECTED',
      comment: message,
      responder: user && user.id,
    });
  };

  workflowActivities.canCancelWorkflow = function canCancelWorkflow(user, workflowId) {
    return workflowActivities.getLastActivity(workflowId).then(function(activity) {
      if (activity) {
        if (activity.state !== 'IN_PROGRESS') {
          return {
            can: false,
            reason: 'Unable to cancel a terminated workflow',
            activity,
          };
        }
        if (activity.requester !== (user && user.id)) {
          return {
            can: false,
            reason: 'Only workflow requester can cancel workflow',
            activity,
          };
        }
        return {
          can: true,
          activity,
        };
      }
      return {
        can: false,
        reason: 'Not found',
        activity,
      };
    });
  };

  workflowActivities.cancelWorkflow = function cancelWorkflow(
    user,
    workflowId,
    message,
    lastActivity,
  ) {
    return db.knex(workflowActivities.table).insert({
      id: generateId(),
      workflowId,
      step: lastActivity.step,
      name: lastActivity.name,
      state: 'CANCELED',
      comment: message,
      responder: user && user.id,
    });
  };

  workflowActivities.canResubmitWorkflow = function canResubmitWorkflow(user, workflowId) {
    return workflowActivities.getLastActivity(workflowId).then(function(activity) {
      if (activity) {
        if (activity.state !== 'CANCELED' && activity.state !== 'REJECTED') {
          return {
            can: false,
            reason: 'Unable to resubmit uncanceled task',
            activity,
          };
        }
        if (activity.requester !== (user && user.id)) {
          return {
            can: false,
            reason: 'Only workflow requester can resubmit workflow',
            activity,
          };
        }
        return {
          can: true,
          activity,
        };
      }
      return {
        can: false,
        reason: 'Not found',
        activity,
      };
    });
  };

  workflowActivities.resubmitWorkflow = function resubmitWorkflow(
    user,
    workflowId,
    message,
    lastActivity,
  ) {
    return db.knex(workflowActivities.table).insert({
      id: generateId(),
      workflowId,
      step: lastActivity.step,
      name: lastActivity.name,
      state: 'IN_PROGRESS',
      comment: message,
      responder: user && user.id,
    });
  };

  workflowActivities.createWorkflowActivity = function createWorkflowActivity(
    user,
    workflowId,
    message,
    action,
  ) {
    var actionPascal = action[0].toUpperCase() + action.substring(1);
    var canDoAction = workflowActivities['can' + actionPascal + 'Workflow'];
    var doAction = workflowActivities[action + 'Workflow'];
    return canDoAction(user, workflowId).then(function(result) {
      // TODO: remove hardcoded auth
      if (result.can || user.id === 's7591665') {
        return doAction(user, workflowId, message, result.activity);
      }
      throw new Error(result.reason);
    });
  };

  return workflowActivities;
};

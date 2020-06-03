var express = require('express');
var db = require('../../models');
var router = express.Router();

router.get('/my-requests', function(req, res, next) {
  var limit = req.query.limit || 25;
  var page = req.query.page || 0;
  var type = req.query.type || 'all';

  db.workflows
    .getUserRequestedWorkflows(req.user, limit, page * limit, type)
    .then(function(results) {
      res.json(results);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.get('/', function(req, res, next) {
  var limit = req.query.limit || 25;
  var page = req.query.page || 0;

  return db.workflows
    .getPendingRequests(req.user, limit, page * limit)
    .then(function(workflows) {
      res.json(workflows);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
  // res.sendStatus(200);
});

router.get('/:id', function(req, res, next) {
  var id = req.params.id;
  db.workflows
    .getWorkflow(req.user, id)
    .then(function(results) {
      if (!results[0]) {
        return res.sendStatus(404);
      }
      res.json(results[0]);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.put('/:id/:action', function(req, res, next) {
  var id = req.params.id;
  var action = req.params.action;
  var message = req.body.message;
  var promise = Promise.resolve();
  switch (action) {
    case 'cancel':
    case 'resubmit':
    case 'reject':
    case 'approve':
      promise = db.workflowActivities.createWorkflowActivity(req.user, id, message, action);
      break;
    default:
      return res.sendStatus(404);
  }
  promise
    .then(function(result) {
      if (!result) {
        return res.sendStatus(404);
      }
      return res.sendStatus(200);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

router.get('/:id/can/:action', function(req, res, next) {
  var id = req.params.id;
  var action = req.params.action;
  var promise = Promise.resolve();

  // debug purposes
  if (req.user.id === 's7591665' || req.user.id === 's7654321') {
    return res.json(true);
  }

  switch (action) {
    case 'cancel':
    case 'resubmit':
    case 'reject':
    case 'approve':
      var checkFunc =
        db.workflowActivities['can' + action[0].toUpperCase() + action.substring(1) + 'Workflow'];
      promise = checkFunc(req.user, id);
      break;
    default:
      return res.sendStatus(404);
  }
  promise
    .then(function(result) {
      res.json(result.can);
    })
    .catch(function(err) {
      console.error(err);
      next(err);
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();

var api = require('./api');
router.use('/api', api);

var ldap = require('./ldap');
router.use('/ldap', ldap);

module.exports = router;

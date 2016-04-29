'use strict';

var router = require('express').Router();
var server = require('http').Server(router);

router.get('/', (req, res) => {
  res.render('Allocator', { 'title': 'Asset Allocator'});
});

module.exports = router;

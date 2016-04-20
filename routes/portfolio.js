'use strict';

var router = require('express').Router();
var server = require('http').Server(router);

router.get('/', (req, res) => {
  res.render('portfolio', { 'title': 'Portfolio'});
});

module.exports = router;

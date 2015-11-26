var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Montevideo en tiempo real' });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var cutcsa = require('../cutcsa/fetch');

var variantIdMap = {};
cutcsa.getVariants().then(function(varMap) {
  variantIdMap = varMap;
});

router.get('/variants/:variant/stops', function(req, res) {
  var variantId = req.params.variant;
  cutcsa.getPath(variantId).then(function (points) {
    res.json(points);
  });
})

/* GET variantId listing. */
router.get('/variants', function(req, res, next) {
  res.json(variantIdMap);
});

router.get('/current', function(req, res, next) {
  cutcsa.getCurrentBuses().then(function (currentBuses) {
    res.json(currentBuses);
  });
});

module.exports = router;

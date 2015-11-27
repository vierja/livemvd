var Promise = require('promise');
var request = require('request');
var constants = require('./constants.js');
var r = require('rethinkdb');

var connection = null;
r.connect( {host: 'rethinkdb', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
})

var getVariants = function() {
  return new Promise(function(resolve, reject) {
    var variantIdMap = {}
    request(constants.base_url + 'GetBusStops2/1979-10-10', function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        for (var i = 0; i < info['BusStops'].length; i++) {
          var stop = info['BusStops'][i];
          var lines = stop['Lines'];
          for (var j = 0; j < lines.length; j++) {
            var line = lines[j];
            if (!(line['VariantId'] in variantIdMap)) {
              variantIdMap[line['VariantId']] = {
                line: line['Bus'],
                destination: line['Destination']
              }
            }
          }
        }
        resolve(variantIdMap);
      } else {
        reject(error);
      }
    });
  });
};

var getPath = function (variantId) {
  return new Promise(function(resolve, reject) {
    request(constants.base_url + 'GetBusPath/' + variantId, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
	resolve(info['Points']);
      } else {
	reject(error);
      }
    });
  });
};

var getCurrentBuses = function () {
  return new Promise(function(resolve, reject) {
    var now = new Date();
    var tenMinutesAgo = new Date(now.getTime() - 2*60000);
    r.db('livemvd').table('cutcsa_locations').filter(
      r.row("date").gt(tenMinutesAgo)
    ).group('unit_id').max('date').run(connection, function(err, cursor) {
      if (err) {
        console.log('returning error:', err);
        reject(err);
      }
      var currentBuses = [];
      cursor.toArray(function(err, results) {
        if (err) {
	  reject(err);
	}
	for (var i=0; i < results.length; i++) {
	  var data = results[i];
          currentBuses.push({
            unit_id: data.group,
            location: data.reduction.location,
	    variant_id: data.reduction.variant_id
          });
	}
        console.log(currentBuses.length, 'current buses.');
        resolve(currentBuses);
      });
    });
  });
}

module.exports = {
  getVariants: getVariants,
  getPath: getPath,
  getCurrentBuses: getCurrentBuses
}

var apiReq = function(endpoint, success) {
  var request = new XMLHttpRequest();
  request.open('GET', endpoint, true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      success(JSON.parse(request.responseText));
    }
  };
  request.send();
}

var VISIBLE = 0.6;
var HIDDEN = 0.2;
var EXPIRED_MIN = 5;

var variantMap = {};
apiReq('/api/variants', function(data) {
  variantMap = data;
});

var map = L.map('map').setView([-34.8696, -56.15147], 13).on('click', function(e) {
  console.log('Resetting map with', resetMap);
  resetMap();
}).locate({setView: true, maxZoom: 16});

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL'
}).addTo(map);

var busIcon = L.icon({
  iconUrl: 'images/mini-bus.png',
  iconRetinaUrl: 'images/mini-bus-retina.png',
  iconSize: [13, 16],
//  iconAnchor: [7, 0]
});

var busLocations = {};

var pathDrawed = null;

var drawPath = function(variantId) {
  if (pathDrawed == null) {
    pathDrawed = L.polyline([], {color: '#BF1111'}).addTo(map);
  }
  apiReq('/api/variants/' + variantId + '/stops', function(stops) {
    if (stops != null) {
      var latlngs = [];
      for (var i = 0; i < stops.length; i++) {
        latlngs.push(L.latLng(stops[i]['Latitude'], stops[i]['Longitude']));
      }
      pathDrawed.setLatLngs(latlngs);
    }
  });
}

var selectedVariant = null;

var hideAllExcept = function(variantId) {
  selectedVariant = variantId;
  for (var unitId in busLocations) {
    if (busLocations[unitId].options.variantId != variantId) {
      busLocations[unitId].setOpacity(HIDDEN);
      busLocations[unitId].setZIndexOffset(0);
    } else {
      busLocations[unitId].setOpacity(VISIBLE);
      busLocations[unitId].setZIndexOffset(100);
    }
	   
  }
}

var showAll = function() {
  selectedVariant = null;
  for (var unitId in busLocations) {
    busLocations[unitId].setOpacity(VISIBLE);
    busLocations[unitId].setZIndexOffset(100);
  }
}

var resetMap = function () {
  if (pathDrawed != null) {
    map.removeLayer(pathDrawed);
    pathDrawed = null;
  }
  showAll();
}


var getTitle = function(variantId, now) {
    var text = variantId;
    if (variantId in variantMap) {
      text = variantMap[variantId]['line'] + ' - ' + variantMap[variantId]['destination'];
      text += '</br>';
      text += moment(now).fromNow();
    }
    return text;
}

var expireBuses = function() {
  var now = Date.now();
  console.log('Expiring buses');
  for (var unitId in busLocations) {
    var lastUpdate = busLocations[unitId].options.lastUpdate;
    if ((now - lastUpdate) > EXPIRED_MIN*60000) {
      console.log('Borro unitId', unitId, 'con ultima actualizacion', lastUpdate);
      map.removeLayer(busLocations[unitId]);
      delete busLocations[unitId];
    }
  }
  setTimeout(expireBuses, 60 * 1000);
}
setTimeout(expireBuses, 60 * 1000);


var busUpdate = function(data) {
  var now = Date.now();
  var title = getTitle(data.variant_id, now);
  if (data.unit_id in busLocations) {
    busLocations[data.unit_id].setLatLng(data.location.coordinates).update().unbindPopup().bindPopup(title);
    busLocations[data.unit_id].options.lastUpdate = now;
  } else {
    var variantId = '' + data.variant_id;
    var opacity = VISIBLE;
    if (selectedVariant != null && selectedVariant != data.variant_id) {
      opacity = HIDDEN;
    }
    busLocations[data.unit_id] = L.marker(data.location.coordinates, {
      icon: busIcon,
      opacity: opacity,
      variantId: data.variant_id,
      unitId: data.unit_id,
      lastUpdate: now
    }).addTo(map).bindPopup(title);
    busLocations[data.unit_id].on('click', function(e) {
      drawPath(this.options.variantId);
      hideAllExcept(this.options.variantId);
    });
  }
}

apiReq('/api/current', function(data) {
  for (var i=0; i < data.length; i++) {
    busUpdate(data[i]);
  }
  var socket = io.connect();
  socket.on('bus', function (data) {
    busUpdate(data);
  });
});


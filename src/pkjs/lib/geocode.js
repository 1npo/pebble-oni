var http = require('./http');
var FIPS = require('./fips');

var BASE = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/' +
	'Places_CouSub_ConCity_SubMCD/MapServer/';
// 4 = Incorporated Places, 5 = Census Designated Places
var LAYERS = [4, 5];

function buildUrl(layer, city, fips) {
	var name = city.trim().toUpperCase().replace(/'/g, "''");
	var where = "UPPER(BASENAME)='" + name + "' AND STATE='" + fips + "'";
	return BASE + layer + '/query?where=' + encodeURIComponent(where) +
		'&outFields=NAME,INTPTLAT,INTPTLON&returnGeometry=false&f=json';
}

function round4(n) {
	return Math.round(n * 10000) / 10000;
}

function queryLayer(i, city, fips, cb) {
	if (i >= LAYERS.length) {
		cb(null, null);
		return;
	}
	http.getJSON(buildUrl(LAYERS[i], city, fips), function (err, json) {
		if (err) {
			cb(err);
			return;
		}
		var f = json.features && json.features[0];
		if (!f) {
			queryLayer(i + 1, city, fips, cb);
			return;
		}
		var lat = parseFloat(f.attributes.INTPTLAT);
		var lon = parseFloat(f.attributes.INTPTLON);
		if (isNaN(lat) || isNaN(lon)) {
			queryLayer(i + 1, city, fips, cb);
			return;
		}
		cb(null, { lat: round4(lat), lon: round4(lon) });
	});
}

// cb(err, {lat, lon} | null). null means the city was not found.
function geocode(city, state, cb) {
	var fips = FIPS[state];
	if (!fips) {
		cb(null, null);
		return;
	}
	var key = 'geo:' + city.trim().toUpperCase() + '|' + state;
	try {
		var cached = JSON.parse(localStorage.getItem(key));
		if (cached) {
			cb(null, cached);
			return;
		}
	} catch (e) {}

	queryLayer(0, city, fips, function (err, loc) {
		if (!err && loc) {
			try {
				localStorage.setItem(key, JSON.stringify(loc));
			} catch (e) {}
		}
		cb(err, loc);
	});
}

function clearCache() {
	var keys = [];
	for (var i = 0; i < localStorage.length; i++) {
		var k = localStorage.key(i);
		if (k && k.indexOf('geo:') === 0) keys.push(k);
	}
	keys.forEach(function (k) { localStorage.removeItem(k); });
}

module.exports = { geocode: geocode, clearCache: clearCache, buildUrl: buildUrl };

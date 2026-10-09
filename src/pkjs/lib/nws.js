var http = require('./http');

var API = 'https://api.weather.gov';
var POINT_TTL_MS = 24 * 3600 * 1000;
var MAX_OBS_AGE_MS = 90 * 60 * 1000;
var MAX_STATIONS = 3;

function pointKey(loc) {
	return 'pts:' + loc.lat + ',' + loc.lon;
}

function readCache(key) {
	try {
		var c = JSON.parse(localStorage.getItem(key));
		if (c && Date.now() - c.at < POINT_TTL_MS) return c;
	} catch (e) {}
	return null;
}

function fetchPoint(loc, cb) {
	var key = pointKey(loc);
	http.getJSON(API + '/points/' + loc.lat + ',' + loc.lon, function (err, pt) {
		if (err) return cb(err);
		var p = pt.properties || {};
		if (!p.observationStations) return cb({ kind: 'http', message: 'no stations url' });
		http.getJSON(p.observationStations + '?limit=' + MAX_STATIONS, function (err2, st) {
			if (err2) return cb(err2);
			var ids = (st.features || []).map(function (f) {
				return f.properties.stationIdentifier;
			});
			var entry = { at: Date.now(), forecastHourly: p.forecastHourly, stations: ids };
			try {
				localStorage.setItem(key, JSON.stringify(entry));
			} catch (e) {}
			cb(null, entry);
		});
	});
}

function getPoint(loc, cb) {
	var cached = readCache(pointKey(loc));
	if (cached) return cb(null, cached);
	fetchPoint(loc, cb);
}

function tryStations(ids, i, cb) {
	if (i >= ids.length) return cb(null, null);
	http.getJSON(API + '/stations/' + ids[i] + '/observations/latest', function (err, json) {
		if (err) {
			// A hard network failure won't be fixed by another station.
			if (err.kind === 'network') return cb(err);
			return tryStations(ids, i + 1, cb);
		}
		var p = json.properties || {};
		var age = Date.now() - new Date(p.timestamp).getTime();
		var temp = p.temperature && p.temperature.value;
		if (temp === null || temp === undefined || !(age <= MAX_OBS_AGE_MS)) {
			return tryStations(ids, i + 1, cb);
		}
		cb(null, p);
	});
}

// cb(err, properties | null). null means no usable observation.
function getLatestObservation(loc, cb) {
	getPoint(loc, function (err, pt) {
		if (err) return cb(err);
		tryStations(pt.stations, 0, function (err2, obs) {
			if (err2 && err2.kind === 'http' && err2.status >= 400 && err2.status < 500) {
				// Cached URLs may have moved; drop the cache so the next refresh re-resolves.
				try { localStorage.removeItem(pointKey(loc)); } catch (e) {}
			}
			cb(err2, obs);
		});
	});
}

function clearCache() {
	var keys = [];
	for (var i = 0; i < localStorage.length; i++) {
		var k = localStorage.key(i);
		if (k && k.indexOf('pts:') === 0) keys.push(k);
	}
	keys.forEach(function (k) { localStorage.removeItem(k); });
}

module.exports = {
	getPoint: getPoint,
	getLatestObservation: getLatestObservation,
	clearCache: clearCache
};

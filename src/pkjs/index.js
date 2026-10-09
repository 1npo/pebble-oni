var Clay = require('@rebble/clay');
var clayConfig = require('./lib/config');
var settings = require('./lib/settings');
var geocode = require('./lib/geocode');
var nws = require('./lib/nws');
var encode = require('./lib/encode');

var clay = new Clay(clayConfig, null, { autoHandleEvents: false });
var inFlight = false;

function send(dict, attempt) {
	console.log('sending ' + JSON.stringify(dict));
	Pebble.sendAppMessage(dict, null, function () {
		if (!attempt) setTimeout(function () { send(dict, 1); }, 2000);
	});
}

function sendStatus(code) {
	send({ WxStatus: code });
}

function refresh() {
	if (inFlight) return;
	var s = settings.load();
	if (!s.city || !s.state) {
		sendStatus(encode.STATUS.NO_CITY);
		return;
	}
	inFlight = true;
	function done(code, dict) {
		inFlight = false;
		if (dict) send(dict); else sendStatus(code);
	}
	function fail(err) {
		done(err.kind === 'network' ? encode.STATUS.NETWORK : encode.STATUS.NO_OBS);
	}

	geocode.geocode(s.city, s.state, function (err, loc) {
		if (err) return fail(err);
		if (!loc) return done(encode.STATUS.NOT_FOUND);
		nws.getLatestObservation(loc, function (err2, obs) {
			if (err2) return fail(err2);
			if (!obs) return done(encode.STATUS.NO_OBS);
			done(encode.STATUS.OK, encode.encodeCurrent(obs, s.units));
		});
	});
}

Pebble.addEventListener('ready', refresh);

Pebble.addEventListener('appmessage', function (e) {
	if (e.payload.RequestWeather !== undefined) refresh();
});

Pebble.addEventListener('showConfiguration', function () {
	Pebble.openURL(clay.generateUrl());
});

Pebble.addEventListener('webviewclosed', function (e) {
	if (!e || !e.response) return;
	var before = settings.load();
	clay.getSettings(e.response, false);
	var after = settings.load();
	if (before.city !== after.city || before.state !== after.state) {
		geocode.clearCache();
		nws.clearCache();
	}
	refresh();
});

// Pure functions: no I/O, unit-testable in Node.
var MISSING = -32768;

// Status codes sent in WxStatus.
var STATUS = { OK: 0, NO_OBS: 1, NETWORK: 3, NOT_FOUND: 4, NO_CITY: 5 };

function num(field) {
	if (!field || field.value === null || field.value === undefined) return null;
	return typeof field.value === 'number' ? field.value : null;
}

function orMissing(n) {
	return n === null ? MISSING : Math.round(n) || 0;
}

// obs: NWS observation `properties`. units: 'us' | 'si'.
function encodeCurrent(obs, units) {
	var imperial = units !== 'si';
	var t = num(obs.temperature);
	var ws = num(obs.windSpeed);
	var wg = num(obs.windGust);
	var hum = num(obs.relativeHumidity);
	var dir = num(obs.windDirection);

	if (imperial) {
		if (t !== null) t = t * 9 / 5 + 32;
		if (ws !== null) ws = ws / 1.609344;
		if (wg !== null) wg = wg / 1.609344;
	}

	var ts = Math.floor(new Date(obs.timestamp).getTime() / 1000);
	return {
		WxStatus: STATUS.OK,
		ObsTime: isNaN(ts) ? MISSING : ts,
		CurTemp: orMissing(t),
		CurHumidity: orMissing(hum),
		CurWindDir: dir === null ? MISSING : Math.round(dir) % 360,
		CurWindSpeed: orMissing(ws),
		CurWindGust: orMissing(wg)
	};
}

module.exports = { MISSING: MISSING, STATUS: STATUS, encodeCurrent: encodeCurrent };

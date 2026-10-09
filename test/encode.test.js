var assert = require('assert');
var e = require('../src/pkjs/lib/encode');

var obs = {
	timestamp: '2026-10-08T12:00:00+00:00',
	temperature: { value: 20 }, relativeHumidity: { value: 45.4 },
	windDirection: { value: 359.6 }, windSpeed: { value: 16.09344 },
	windGust: { value: null }
};
var us = e.encodeCurrent(obs, 'us');
assert.strictEqual(us.CurTemp, 68);
assert.strictEqual(us.CurHumidity, 45);
assert.strictEqual(us.CurWindDir, 0);
assert.strictEqual(us.CurWindSpeed, 10);
assert.strictEqual(us.CurWindGust, e.MISSING);
assert.strictEqual(us.ObsTime, 1791460800);

var si = e.encodeCurrent(obs, 'si');
assert.strictEqual(si.CurTemp, 20);
assert.strictEqual(si.CurWindSpeed, 16);

obs.temperature.value = -17.8;
assert.strictEqual(e.encodeCurrent(obs, 'us').CurTemp, 0);
console.log('ok');

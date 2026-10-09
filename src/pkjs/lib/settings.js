var DEFAULTS = { city: '', state: '', units: 'us' };

function load() {
	var raw = {};
	try {
		raw = JSON.parse(localStorage.getItem('clay-settings')) || {};
	} catch (e) {}
	return {
		city: String(raw.City || DEFAULTS.city).trim(),
		state: String(raw.State || DEFAULTS.state),
		units: raw.Units === 'si' ? 'si' : DEFAULTS.units
	};
}

module.exports = { load: load };

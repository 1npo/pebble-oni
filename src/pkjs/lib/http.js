var TIMEOUT_MS = 15000;
var USER_AGENT = '(1npo/pebble-oni, nickpeteromalley@gmail.com)';

function getJSON(url, cb) {
	var done = false;
	var xhr = new XMLHttpRequest();

	function finish(err, json) {
		if (done) return;
		done = true;
		clearTimeout(timer);
		cb(err, json);
	}

	var timer = setTimeout(function () {
		xhr.abort();
		finish({ kind: 'network', message: 'timeout' });
	}, TIMEOUT_MS);

	xhr.onload = function () {
		if (xhr.status < 200 || xhr.status >= 300) {
			finish({ kind: 'http', status: xhr.status, message: 'HTTP ' + xhr.status });
			return;
		}
		var json;
		try {
			json = JSON.parse(xhr.responseText);
		} catch (e) {
			finish({ kind: 'http', status: xhr.status, message: 'bad JSON' });
			return;
		}
		finish(null, json);
	};
	xhr.onerror = function () {
		finish({ kind: 'network', message: 'network error' });
	};

	xhr.open('GET', url);
	xhr.setRequestHeader('Accept', 'application/geo+json');
	try {
		xhr.setRequestHeader('User-Agent', USER_AGENT);
	} catch (e) {
		// Some runtimes forbid this header; NWS currently accepts without it.
	}
	xhr.send();
}

module.exports = { getJSON: getJSON };

// TODO Set irrigation interval
var maxHistorySize = 250,
	readingScale = 256,
	handlers = {
		/*'#btn-lighting-on': function() {
			sendSocket('lighting:1');
		},
		'#btn-lighting-off': function() {
			sendSocket('lighting:0');
		},
		'#btn-lighting-auto': function() {
			sendSocket('lighting:2');
		},*/

		/*'state.irrigation': function(request) {
			updateControlUI('irrigation', parseInt(request.parameters[0], 10));
		},
		'status.irrigation': function(request) {
			updateStatusUI('irrigation', parseInt(request.parameters[0]) === 1);
		},

		'state.lighting': function(request) {
			updateControlUI('lighting', parseInt(request.parameters[0], 10));
		},
		'status.lighting': function(request) {
			updateStatusUI('lighting', parseInt(request.parameters[0]) === 1);
		},*/

		'oxygen': function(request) {
			// TODO Implement
		},

		'history': function(request) {
			var type = request.parameters[0],
				values = JSON.parse(request.parameters[1]),
				i;

			for (i = 0; i < values.length; i++) {
				values[i] = parseInt(values[i], 10) / readingScale * 100;
			}

			if (type === 'light-level') {
				lightLevel = values;

				drawLightLevelGraph();
			}
		},

		'light-level': function(request) {
			var level = parseInt(request.parameters[0], 10) / readingScale * 100;

			if (lightLevel.length >= maxHistorySize) {
				lightLevel.shift();
			}

			lightLevel.push(level);

			drawLightLevelGraph();
		}
	},
	lightLevel = [],
	config = {
		socket: {
			host: '127.0.0.1',
			port: 8080
		}
	},
	firstLightLevelRender = true,
	ws = null;

function log() {
	console.log.apply(console, arguments);
}

function sendSocket(message) {
	log('SOCKET > ' + message);

	ws.send(message);
}

function updateControlUI(control, mode) {
	if (mode === 1) { // on
		$('.' + control + '-btn').prop('disabled', true).removeClass('btn-primary');
		$('#btn-' + control + '-on').addClass('btn-primary');
		$('#btn-' + control + '-off').prop('disabled', false);
		$('#btn-' + control + '-auto').prop('disabled', false);
	} else if (mode === 2) { // auto
		$('.' + control + '-btn').prop('disabled', true).removeClass('btn-primary');
		$('#btn-' + control + '-auto').addClass('btn-primary');
		$('#btn-' + control + '-on').prop('disabled', false);
		$('#btn-' + control + '-off').prop('disabled', false);
	} else { // off
		$('.' + control + '-btn').prop('disabled', true).removeClass('btn-primary');
		$('#btn-' + control + '-off').addClass('btn-primary');
		$('#btn-' + control + '-on').prop('disabled', false);
		$('#btn-' + control + '-auto').prop('disabled', false);
	}
}

function updateStatusUI(control, mode) {
	if (mode) {
		$('.status-' + control).addClass('status-active');
	} else {
		$('.status-' + control).removeClass('status-active');
	}
}

function drawLightLevelGraph() {
	$('#light-level-graph').highcharts({
		title: {
			text: ''/*,
			x: -20 //center*/
		},
		/*subtitle: {
			text: 'Source: WorldClimate.com',
			x: -20
		},*/
		/*xAxis: {
			categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
				'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		},*/
		yAxis: {
			title: {
				text: 'Relative Intensity (%)'
			},
			plotLines: [{
				value: 0,
				width: 1,
				color: '#808080'
			}]
		},
		/*tooltip: {
			valueSuffix: '°C'
		},*/
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0
		},
		series: [{
			name: 'Light Level',
			data: lightLevel,
			showInLegend: false
		}],
		plotOptions: {
			line: {
				animation: firstLightLevelRender,
				marker: {
					enabled: false
				}
			}
		}
	});

	firstLightLevelRender = false;
}

function init() {
	var hashPos = window.location.href.indexOf('#');

	if (hashPos !== -1) {
		config.socket.host = window.location.href.substr(hashPos + 1);
	}

	setupSocket(config.socket.host, config.socket.port);
	setupHandlers();
	setupUI();
}

function setupHandlers() {
	var selector;

	for (selector in handlers) {
		$(selector).click(handlers[selector]);
	}
}

function setupUI() {
	$('.state-btn').each(function() {
		setupStateBtn($(this));
	});

	$('#lighting-threshold').keyup(function() {
		var raw = $(this).val(),
			numeric = parseInt(raw, 10),
			value;

		if (numeric.toString() !== raw) {
			log('ignore light', raw);

			return;
		}

		value = numeric;

		sendSocket('lighting-threshold:' + value);
	});
}

function setupStateBtn(el) {
	var type = el.data('type'),
		state = el.data('state');

	el.click(function() {
		sendSocket(type + ':' + state);
	});

	handlers['state.' + type] = function(request) {
		updateControlUI(type, parseInt(request.parameters[0], 10));
	};

	handlers['status.' + type] = function(request) {
		updateStatusUI(type, parseInt(request.parameters[0]) === 1);
	};

	el.prop('disabled', true);
}

function onOpen() {
	sendSocket('get-irrigation');
	sendSocket('get-lighting');
	sendSocket('get-oxygen');

	sendSocket('get-config');
	sendSocket('get-history:light-level');
}

function setupSocket(host, port) {
	var endpoint = 'ws://' + host + ':' + port;

	ws = new WebSocket(endpoint);

	ws.onmessage = function(message) {
		var request = parseMessage(message.data);

		log('SOCKET < ' + message.data);

		if (!handleSystemRequest(request)) {
			if (typeof(handlers[request.name]) === 'function') {
				handlers[request.name].apply(handlers[request.name], [request]);
			}/* else {
				log('- Unknown request', request);
			}*/
		}
	};

	ws.onopen = function() {
		log('! Connection opened');

		onOpen();
	};

	ws.onclose = function() {
		log('! Connection closed');
	};

	ws.onerror = function() {
		log('- Connection error');
	};
}

function handleSystemRequest(request) {
	switch (request.name) {
		case 'config':
			handleConfig(JSON.parse(request.original.substr(7)));
		break;

		default:
			return false;
	}

	return true;
}

function handleConfig(config) {
	$('#lighting-threshold').prop('disabled', false).val(config.lighting.threshold);
	$('#irrigation-interval').prop('disabled', false).val(config.irrigation.interval / (1000 * 60)); // minutes
	$('#irrigation-duration').prop('disabled', false).val(config.irrigation.duration / 1000); // seconds
}

function parseMessage(message) {
	var delimiterPos = message.indexOf(':'),
		name = message,
		parameters = [],
		tokens;

	if (delimiterPos !== -1) {
		tokens = message.split(':');
		name = tokens[0];
		parameters = tokens.slice(1);
	}

	return {
		name: name,
		parameters: parameters,
		original: message,
		serial: '<' + message + '>'
	};
}

$(document).ready(function() {
	init();
});

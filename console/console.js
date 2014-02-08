// TODO Set irrigation interval
var maxHistorySize = 250,
	handlers = {
		'#btn-on': function() {
			sendSocket('lighting:1');
		},
		'#btn-off': function() {
			sendSocket('lighting:0');
		},

		'irrigation': function(request) {
			// TODO Implement
		},
		'lighting': function(request) {
			var on = parseInt(request.parameters[0], 10) === 1;

			if (on) {
				$('#lighting-indicator').addClass('on');
				$('#btn-on').prop('disabled', true);
				$('#btn-off').prop('disabled', false);
			} else {
				$('#lighting-indicator').removeClass('on');
				$('#btn-on').prop('disabled', false);
				$('#btn-off').prop('disabled', true);
			}
		},
		'oxygen': function(request) {
			// TODO Implement
		},

		'history': function(request) {
			var type = request.parameters[0],
				values = JSON.parse(request.parameters[1]),
				i;

			for (i = 0; i < values.length; i++) {
				values[i] = parseInt(values[i], 10);
			}

			if (type === 'light-level') {
				lightLevel = values;

				drawLightLevelGraph();
			}
		},

		'light-level': function(request) {
			var level = parseInt(request.parameters[0], 10);

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

function drawLightLevelGraph() {
	$('#light-level-graph').highcharts({
		title: {
			text: 'Light Intensity',
			x: -20 //center
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
				animation: firstLightLevelRender
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
}

function setupHandlers() {
	var selector;

	for (selector in handlers) {
		$(selector).click(handlers[selector]);
	}
}

function onOpen() {
	sendSocket('get-irrigation');
	sendSocket('get-lighting');
	sendSocket('get-oxygen');

	sendSocket('get-history:light-level');
}

function setupSocket(host, port) {
	var endpoint = 'ws://' + host + ':' + port;

	ws = new WebSocket(endpoint);

	ws.onmessage = function(message) {
		var request = parseMessage(message.data);

		log('SOCKET < ' + message.data);

		if (typeof(handlers[request.name]) === 'function') {
			//log('! Handling request', request);

			handlers[request.name].apply(handlers[request.name], [request]);
		} else {
			log('- Unknown request', request);
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

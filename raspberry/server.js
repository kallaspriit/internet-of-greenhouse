var serialAPI = require('serialport'),
	SerialPort = serialAPI.SerialPort,
	WebSocket = require('ws'),
	ws = null,
	serialPorts = [],
	serialPort = null,
	updateInterval = null;
	lastTickTime = 0,
	portName = null,
	config = {
		socket: {
			host: '127.0.0.1',
			port: 8080
		},
		lighting: {
			threshold: 50
		},
		irrigation: {
			interval: 60 * 60 * 1000,
			duration: 10 * 1000
		},
		//acquisitionInterval: 60000
		acquisitionInterval: 1000,
		readingScale: 1024
	},
	State = {
		OFF: 0,
		ON: 1,
		AUTO: 2
	},
	Status = {
		OFF: 0,
		ON: 1
	},
	state = {
		irrigation: State.AUTO,
		lighting: State.AUTO,
		oxygen: State.AUTO
	},
	status = {
		irrigation: Status.OFF,
		lighting: Status.OFF,
		oxygen: Status.OFF,
		lightLevel: 0
	},
	lastState = null,
	lastStatus = null,
	handlers = {
		serial: {
			/*'irrigation': function(request) {
				state.irrigation = parseInt(request.parameters[0], 10);

				sendSocket('irrigation:' + state.irrigation);
			},
			'lighting': function(request) {
				state.lighting = parseInt(request.parameters[0], 10);

				sendSocket('lighting:' + state.lighting);
			},
			'oxygen': function(request) {
				state.oxygen = parseInt(request.parameters[0], 10);

				sendSocket('oxygen:' + state.oxygen);
			},*/

			'light-level': function(request) {
				status.lightLevel = parseInt(request.parameters[0], 10);

				sendSocket('light-level:' + status.lightLevel);
			}
		},
		socket: {
			'irrigation': function(request) {
				setState('irrigation', request.parameters[0]);
			},
			'lighting': function(request) {
				setState('lighting', request.parameters[0]);
			},
			'oxygen': function(request) {
				setState('oxygen', request.parameters[0]);
			},

			'get-irrigation': function(request) {
				sendSocket('irrigation:' + state.irrigation);
			},
			'get-lighting': function(request) {
				sendSocket('lighting:' + state.lighting);
			},
			'get-oxygen': function(request) {
				sendSocket('oxygen:' + state.oxygen);
			},

			'get-light-level': function(request) {
				sendSocket('oxygen:' + state.oxygen);
			},
			'get-config': function() {
				lastState = null;
				lastStatus = null;

				sendConfig();
				tick();
			},

			// configuration parameters
			'lighting-threshold': function(request) {
				var value = Math.min(Math.max(parseInt(request.parameters[0], 10), 0), 100);

				config.lighting.threshold = value;

				sendConfig();
			},
			'irrigation-interval': function(request) {
				var value = Math.max(parseInt(request.parameters[0], 10), 0);

				config.irrigation.interval = value;

				sendConfig();
			},
			'irrigation-duration': function(request) {
				var value = Math.max(parseInt(request.parameters[0], 10), 0);

				config.irrigation.duration = value;

				sendConfig();
			}
		}
	};

function setState(name, value) {
	state[name] =  parseInt(value, 10);

	tick();
}

function sendConfig() {
	sendSocket('config:' + JSON.stringify(config));
}

function log() {
	console.log.apply(console, arguments);
}

function sendSerial(message) {
	log('SERIAL > ' + message);

	serialPort.write(message);
}

function sendSocket(message) {
	if (ws.readyState !== 1) {
		log('! Socket not ready yet to transmit: ' + message);

		return;
	}

	log('SOCKET > ' + message);

	ws.send(message);
}

function setupSerial() {
	serialPort = new SerialPort(portName, {
		baudrate: 9600,
		parser: serialAPI.parsers.readline('\r\n')
	});

	serialPort.on('open',function() {
		log('! Serial connection opened');

		serialPort.on('data', function(data) {
			handleSerialMessage(data);
		});

		onSerialOpen();
	});
}

function setupSocket(host, port) {
	var endpoint = 'ws://' + host + ':' + port + '/';

	log('! Connecting to web-socket server at ' + endpoint);

	ws = new WebSocket(endpoint);

	ws.on('open', function() {
		log('! Socket connection opened');

		onSocketOpen();
	});

	ws.on('message', function(message/*, flags*/) {
		handleSocketMessage(message);
	});

	ws.on('error', function() {
		log('- Opening WebSocket connection failed');
	});
}

function setupTicker() {
	var interval = 1000;

	setInterval(function() {
		var currentTime = (new Date().getTime());
			dt = interval;

		if (lastTickTime !== 0) {
			dt = currentTime - lastTickTime;
		}

		lastTickTime = currentTime;

		tick(dt);
	}, interval);
}

function tick(dt) {
	var name,
		enable;

	switch (state.lighting) {
		case State.ON:
			status.lighting = Status.ON;
		break;

		case State.OFF:
			status.lighting = Status.OFF;
		break;

		case State.AUTO:
			status.lighting = status.lightLevel / config.readingScale * 100 <= config.lighting.threshold
				? Status.ON
				: Status.OFF;
		break;
	}

	switch (state.irrigation) {
		case State.ON:
			status.irrigation = Status.ON;
		break;

		case State.OFF:
			status.irrigation = Status.OFF;
		break;

		case State.AUTO:
			status.irrigation = Status.OFF; // TODO
		break;
	}

	for (name in state) {
		if (lastState === null || lastState[name] !== state[name]) {
			sendSocket('state.' + name  + ':' + state[name]);
		}
	}

	for (name in status) {
		if (lastStatus === null || lastStatus[name] !== status[name]) {
			sendSerial(name  + ':' + status[name]);
			sendSocket('status.' + name  + ':' + status[name]);
		}
	}

	lastState = deepClone(state);
	lastStatus = deepClone(status);
}

function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function onSerialOpen() {
	sendSerial('get-irrigation');
	sendSerial('get-lighting');
	sendSerial('get-oxygen');

	if (updateInterval !== null) {
		clearInterval(updateInterval);
	}

	updateInterval = setInterval(function() {
		requestUpdate();
	}, config.acquisitionInterval);

	requestUpdate();
}

function onSocketOpen() {
	sendSocket('become-device');
}

function requestUpdate() {
	sendSerial('get-light-level');
}

function handleSerialMessage(message) {
	var request = parseMessage(message);

	log('SERIAL < ' + message);

	if (typeof(handlers.serial[request.name]) === 'function') {
		//log('! Handling serial request', request);

		handlers.serial[request.name].apply(handlers[request.name], [request]);
	}/* else {
		log('- Unknown serial request', request);
	}*/
}

function handleSocketMessage(message) {
	var request = parseMessage(message);

	log('SOCKET < ' + message);

	if (typeof(handlers.socket[request.name]) === 'function') {
		//log('! Handling socket request', request);

		handlers.socket[request.name].apply(handlers[request.name], [request]);
	} else {
		log('- Unknown socket request', request);
	}
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

function bootstrap() {
	if (process.argv.length >= 3) {
		config.socket.host = process.argv[2];
	}

	if (process.argv.length >= 4) {
		config.socket.port = process.argv[3];
	}

	serialAPI.list(function (err, ports) {
		for (var i = 0; i < ports.length; i++) {
			log('! Detected port ' + ports[i].comName + '(' + ports[i].manufacturer + ')');

			serialPorts.push({
				id: ports[i].comName,
				name: ports[i].manufacturer
			});

			if (
				typeof(ports[i].manufacturer) !== 'string'
				|| ports[i].manufacturer.indexOf('PJRC') !== -1
				|| ports[i].manufacturer.toLowerCase().indexOf('arduino') !== -1
			) {
				log('! Found hardware on ' + ports[i].comName);

				portName = ports[i].comName;
			}
		}

		if (portName === null) {
			log('- Failed to find the device on any of the COM ports');

			process.exit(1);
		}

		init(portName);
	});
}

function init(portName) {
	log('! Initiating on ' + portName);

	setupSocket(config.socket.host, config.socket.port);
	setupSerial();
	setupTicker();
}


bootstrap();
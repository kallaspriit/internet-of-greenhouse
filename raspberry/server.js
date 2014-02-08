var serialAPI = require('serialport'), //https://github.com/voodootikigod/node-serialport
	SerialPort = serialAPI.SerialPort,
	WebSocket = require('ws'),
	ws = null,
	serialPorts = [],
	serialPort = null,
	config = {
		socket: {
			host: '127.0.0.1',
			port: 8080
		}
	};

function log() {
	console.log.apply(console, arguments);
}

function sendSerial(message, callback) {
	log('SERIAL < ' + message);

	serialPort.write(message + '\n', typeof(callback) === 'function' ? callback : null);
}

function sendSocket(message) {
	log('SOCKET < ' + message);

	ws.send(message);
}

function init(portName) {
	log('! Initiating on ' + portName);

	setupSerial();
	setupSocket(config.socket.host, config.socket.port);
}

function setupSerial() {
	serialPort = new SerialPort(portName, {
		baudrate: 9600,
		parser: serialAPI.parsers.readline('\r\n')
	});

	serialPort.on('open',function() {
		log('! Port opened');

		// TODO Remove test
		var on = false;

		setInterval(function() {
			on = !on;

			sendSerial(on ? 'H' : 'L');
		}, 500);

		serialPort.on('data', function(data) {
			log('SERIAL > ' + data);

			/*broadcastAll({
			 type: 'device',
			 data: data
			 });*/
		});

		//sendSerial('<RESET>');
	});
}

function setupSocket(host, port) {
	var endpoint = 'ws://' + host + ':' + port + '/';

	log('! Connecting to web-socket server at ' + endpoint);

	ws = new WebSocket(endpoint);

	ws.on('open', function() {
		log('! Socket connection opened');

		sendSocket('hello!');
	});

	ws.on('message', function(data/*, flags*/) {
		log('SOCKET < ' + data);
	});
}

function bootstrap() {
	serialAPI.list(function (err, ports) {
		for (var i = 0; i < ports.length; i++) {
			log('! Detected port ' + ports[i].comName + '(' + ports[i].manufacturer + ')');

			serialPorts.push({
				id: ports[i].comName,
				name: ports[i].manufacturer
			});

			if (ports[i].manufacturer.indexOf('PJRC') !== -1) {
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

bootstrap();
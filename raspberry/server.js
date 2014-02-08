var serialAPI = require('serialport'), //https://github.com/voodootikigod/node-serialport
	SerialPort = serialAPI.SerialPort,
	serialPorts = [],
	serialPort = null;

function log() {
	var message = getDatetime() + ' ',
		items = [getDatetime()],
		type,
		i;

	for (i = 0; i < arguments.length; i++) {
		type = typeof(arguments[i]);

		if (i > 0) {
			message += ', ';
		} else {
			if (typeof(arguments[i]) !== 'string' || arguments[i].substr(0, 1) !== '[') {
				message += '[S] ';
			}
		}

		switch (type) {
			case 'string':
				message += arguments[i];
				break;

			case 'number':
				message += arguments[i];
				break;

			default:
				if (arguments[i] === 'null') {
					message += 'null';
				} else {
					message += JSON.stringify(arguments[i]);
				}
				break;
		}

		items.push(arguments[i]);
	}

	//fs.appendFileSync(logFilename, message + '\n');

	console.log.apply(console, items);
}

function getDatetime(includeSeconds) {
	var date = new Date();

	return (date.getDate() < 10 ? '0' : '') + date.getDate()
		+ '.' + (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1)
		+ ' ' + (date.getHours() < 10 ? '0' : '') + date.getHours()
		+ ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
		+ (includeSeconds !== false ? ':' + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds() : '');
}

function sendDevice(message, callback) {
	log('< ' + message);

	serialPort.write(message + '\n', typeof(callback) === 'function' ? callback : null);
}

function init(portName) {
	log('! Initiating on ' + portName);

	serialPort = new SerialPort(portName, {
		baudrate: 9600,
		parser: serialAPI.parsers.readline('\r\n')
	});

	serialPort.on('open',function() {
		log('! Port opened');

		var on = false;

		setInterval(function() {
			on = !on;

			sendDevice(on ? 'H' : 'L');
		}, 500);

		serialPort.on('data', function(data) {
			log('> ' + data);

			/*broadcastAll({
				type: 'device',
				data: data
			});*/
		});

		//sendDevice('<RESET>');
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
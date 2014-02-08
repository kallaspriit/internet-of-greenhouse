var SocketServer = require('ws').Server,
	socketServer = null,
	clientIdCounter = 0,
	clients = [],
	device = null,
	history = {},
	acquisitionInterval = 60000,
	//maxHistorySize = 7 * 24 * 60 * 60 * 1000 / acquisitionInterval, // 7 days
	maxHistorySize = 250,
	config = {
		socket: {
			host: '127.0.0.1',
			port: 8080
		}
	};

function log() {
	console.log.apply(console, arguments);
}

function init(host, port) {
	log('! Starting server on ' + host + ':' + port);

	socketServer = new SocketServer({
		host: host,
		port: port/*,
		protocolVersion: 13*/
	});

	socketServer.on('connection', function(client) {
		client.id = clientIdCounter++;
		clients.push(client);

		log('! Client #' + client.id + ' connected (' + clients.length + ' total)');

		onOpen(client);
	});

	test();
}

function onOpen(client) {
	client.on('message', function(message) {
		log('[' + client.id + '] > ' + message);

		handleMessage(message, client);
	});

	client.on('close', function(code, message) {
		if (typeof(message) !== 'string' || message.length === 0) {
			message = '';
		}

		var newClients = [],
			i;

		for (i = 0; i < clients.length; i++) {
			if (clients[i] === client) {
				log('! Client #' + clients[i].id + ' disconnected [' + code + '] ' + message);

				continue;
			}

			newClients.push(clients[i]);
		}

		clients = newClients;
	});

	client.send = function(message) {
		if (this.client.readyState !== 1) {
			log(
				'- Unable to send message to #' + this.client.id +', invalid state: ' +
					this.client.readyState, message
			);

			return null;
		}

		if (typeof(message) === 'object') {
			message = JSON.stringify(message);
		}

		log('[' + this.client.id + '] < ' + message);

		return this.send.call(this.client, message);
	}.bind({ client: client, send: client.send });
}

function handleMessage(message, client) {
	if (!handleServerMessage(message, client)) {
		broadcast(message, client);
	}

	if (client === device) {
		storeHistory(message);
	}
}

function handleServerMessage(message, client) {
	var request = parseMessage(message);

	switch (request.name) {
		case 'become-device':
			console.log('! Client #' + client.id + ' is now the device');

			device = client;
		break;

		case 'get-history':
			sendHistory(request.parameters[0], client);
		break;

		default:
			return false;
	}

	return true;
}

function sendHistory(name, client) {
	var items = [];

	if (typeof(history[name]) !== 'undefined') {
		items = history[name];
	}

	client.send('history:' + name + ':' + JSON.stringify(items));
}

function storeHistory(message) {
	var request = parseMessage(message);

	if (typeof(history[request.name]) === 'undefined') {
		history[request.name] = [];
	}

	if (history[request.name].length >= maxHistorySize) {
		history[request.name].shift();
	}

	// TODO Only first parameter should do?
	history[request.name].push(request.parameters[0]);
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

function broadcast(message, exclude) {
	var i;

	for (i = 0; i < clients.length; i++) {
		if (clients[i] === exclude) {
			continue;
		}

		clients[i].send(message);
	}
}

function test() {

}

function bootstrap() {
	if (process.argv.length >= 3) {
		config.socket.host = process.argv[2];
	}

	if (process.argv.length >= 4) {
		config.socket.port = process.argv[3];
	}

	init(config.socket.host, config.socket.port);
}

bootstrap();
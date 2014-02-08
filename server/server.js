var SocketServer = require('ws').Server,
	socketServer = null,
	clientIdCounter = 0,
	clients = [],
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

		client.on('message', function(message) {
			log('[' + client.id + '] > ' + message);

			/*if (message.substr(0, 1) === '{') {
				var request = JSON.parse(message),
					parameters = request.parameters,
					responseData;

				if (typeof(handlers[request.handler]) === 'function') {
					responseData = handlers[request.handler].call(handlers[request.handler], parameters, client);
				} else {
					responseData = handlers.forward.call(handlers.forward, request.handler, parameters, client);
				}

				if (request.expectResponse) {
					var response = {
						type: 'response',
						requestId: request.id,
						data: responseData
					};

					client.send(response);
				}
			}*/
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

		// TODO Remove test
		setInterval(function() {
			var i;

			for (i = 0; i < clients.length; i++) {
				clients[i].send({
					type: 'hello',
					data: {
						clientId: clients[i].id,
						timestamp: (new Date()).getTime()
					}
				});
			}
		}, 1000);
	});
}

function test() {

}

function bootstrap() {
	init(config.socket.host, config.socket.port);
}

bootstrap();
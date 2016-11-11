let WebSocketServer = require('ws').Server;
let wss = new WebSocketServer({ port: 8080 });
let clients = {};

console.log('server is now running');

wss.on('connection', function connection(ws) {
	
	ws.on('message', function incoming(message) {
		let msg = JSON.parse(message);
		let op = msg.op;
		switch (op) {
			case "connect":
				console.log('connected: ' + msg.name);
				clients[msg.name] = { socket: ws };
				console.log('remote ip: ' + ws._socket.remoteAddress);
				ws.send(JSON.stringify({
					op: 'connection_status',
					status: 'connected'
				}));
				update_contacts();
				break;
			case "send": 
				console.log('message from ' + msg.from + ' to ' + msg.to + ': ' + msg.msg);
				clients[msg.to].socket.send(JSON.stringify({
					op: 'message',
					from: msg.from,
					msg: msg.msg
				}));
				break;
			default: 
				break;
		}
	});

	ws.on('close', function() {
		update_contacts();
	});
});

function update_contacts() {
	let contact_list = [];
	for (val in clients) {
		contact_list.push(val);
	}
	let contact_list_string = contact_list.join(":");
	for (val in clients) {
		clients[val]['socket'].send(JSON.stringify({
			op: 'update',
			contact_list: contact_list_string
		}))
	};
}



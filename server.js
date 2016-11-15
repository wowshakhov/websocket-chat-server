var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8080 });
var clients = {};

console.log('server is now running');

wss.on('connection', function connection(ws) {
    
    ws.on('message', function incoming(message) {
        var msg = JSON.parse(message);
        var op = msg.op;
        switch (op) {
            case "connect":
                if (!msg.name || msg.name == "Me") {
                    console.log('NULL CONNECTED');
                    ws.send(JSON.stringify({
                        op: 'connection_status',
                        status: 'invalid_name'
                    }));
                    break;
                }
                if (!clients[msg.name]) {
                    console.log('connected: ' + msg.name);
                    console.log('remote ip: ' + ws._socket.remoteAddress);
                    clients[msg.name] = { socket: ws };
                    ws.send(JSON.stringify({
                        op: 'connection_status',
                        status: 'connected'
                    }));
                    update_contacts();
                }
                else {
                    ws.send(JSON.stringify({
                        op: 'connection_status',
                        status: 'name_already_taken'
                    }));
                }
                break;
            case "sendmsg": 
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
        for (var elem in clients) {
            if (clients[elem].socket._socket.remoteAddress === ws._socket.remoteAddress &&
                clients[elem].socket._socket.remotePort === ws._socket.remotePort) {
                console.log(elem + ' disconnected');
                delete clients[elem];
            }
        }
        update_contacts();
    });
});

function update_contacts() {
    var contact_list = [];
    for (val in clients) {
        contact_list.push(val);
    }
    var contact_list_string = contact_list.join(":");
    console.log(contact_list_string);
    for (val in clients) {
        clients[val]['socket'].send(JSON.stringify({
            op: 'update',
            contact_list: contact_list_string
        }))
    };
}

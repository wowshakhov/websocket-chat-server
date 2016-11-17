let WebSocketServer = require('ws').Server;
let wss = new WebSocketServer({ port: 8080 });
let clients = {};

console.log('server is now running');

/**
 * Connection handler
 */
wss.on('connection', ws => {
    
    ws.on('message', message => {
        let msg = JSON.parse(message);
        let op = msg.op;
        switch (op) {
            // Handle new connection
            case "connect":
                // Incorrect name
                if (!msg.name || msg.name == "Me") {
                    console.log('connection error: invalid name');
                    ws.send(JSON.stringify({
                        op: 'connection_status',
                        status: 'invalid_name'
                    }));
                    break;
                }
                // Correct name and isn't taken
                if (!clients[msg.name]) {
                    console.log('connected: ' + msg.name);
                    console.log('remote ip: ' + ws._socket.remoteAddress);
                    clients[msg.name] = { socket: ws };
                    ws.send(JSON.stringify({
                        op: 'connection_status',
                        status: 'connected'
                    }));
                    updateContacts();
                }
                // Name already taken
                else {
                    ws.send(JSON.stringify({
                        op: 'connection_status',
                        status: 'name_already_taken'
                    }));
                }
                break;
            // Handle new message
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
    // Updates contact lists on disconnection 
    ws.on('close', () => {
        for (let elem in clients) {
            if (clients[elem].socket._socket.remoteAddress === ws._socket.remoteAddress &&
                clients[elem].socket._socket.remotePort === ws._socket.remotePort) {
                console.log(elem + ' disconnected');
                delete clients[elem];
            }
        }
        updateContacts();
    });
});

/**
 * Updates users' contac lists
 */
function updateContacts() {
    let contactList = [];
    for (val in clients) {
        contactList.push(val);
    }
    let contactListString = contactList.join(":");
    console.log(contactListString);
    for (val in clients) {
        clients[val]['socket'].send(JSON.stringify({
            op: 'update',
            contactList: contactListString
        }))
    };
}

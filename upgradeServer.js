'use strict';

require("dotenv").config(); // environment setup

const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const server = http.createServer();
const wsServer = new WebSocket.Server( // represents websocket server
    { noServer: true } // issue manual upgrade
); 
const WEB_SRV_HOST = 'localhost';  // interface to bind to (could be only one)
const WEB_SRV_PORT = 8080; // port on interface
const HEARTBEAT_INT_MS = 30000; // check client is still connected

// same codetable as driver 
const WS_READY_STATE = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

function noop() {}

/**
 * Assume we have some meaningfull authentication handler
 * @param {*} request 
 * @param {*} cbAuthenticated 
 */
function authenticate(request, cbAuthenticated) {
    debugger;
    console.log(JSON.stringify(request.headers));
    cbAuthenticated();
}


wsServer.on('connection', function connection(webSocket, req) {

    // websocket represent client websocket; ie socket connected to client. connection is bidirectional

    var statInt;
    
    console.log('Connected from: ' + req.url);

    // define manual propety on webSocket object to track liveliness
    webSocket.isAlive = true;
    
    webSocket.on('pong', function(){ // register handler, when client respons with PONG
        console.log("Received heartbeat PONG")
        this.isAlive = true;
    }); 

    webSocket.on('message', function incoming(message) { // recive msg from client
        console.log('received: ', message);
        var receivedMsg = JSON.parse(message);
        
        // respond back to heartbeat message
        let date = new Date(); 
        let now_utc =  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        let now_utc_str = `"${now_utc}"`;

        // send back ocpp heartbeat response
        webSocket.send(
            JSON.stringify( { "received": receivedMsg, "currentTime": now_utc_str})
        ); 

    });

    webSocket.on('close', function close() {
       console.log('client connection closed'); 
    });

    // occasionaly send some dummy data
    statInt = setInterval(function() {

        //if (webSocket.readyState === WS_READY_STATE.OPEN){
        if (webSocket.readyState === WS_READY_STATE.CLOSING || webSocket.readyState === WS_READY_STATE.CLOSED){
            //debugger;
            console.log("Websocket was disconnected");    
            clearInterval(statInt);
        }
        
    }, 60_000);

});

wsServer.on('close', function close() {
    console.log("Shuting down websocket server");
    clearInterval(intervalHeartbeat);
});

server.on('upgrade', function upgrade(request, socket, head) {
    debugger;
    console.log('New request from HTTP URI:' + request.url);
    const pathname = url.parse(request.url).pathname;

    if (pathname.indexOf('antaranga') > -1) {
        console.log("Upgrade request will be sent")

        authenticate(request, (err) => {
            if (err) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            console.log("Client authenticated");
            wsServer.handleUpgrade(request, socket, head, function done(webSocket) {
                wsServer.emit('connection', webSocket, request);
            });
        });

    } else {
        console.log("Wrong data for creating connection - closing connection forcefuly");        
        socket.destroy();
    }
});

function logClient(client){
    var sb = ["Connected client "];
    sb.push(client._socket.remoteAddress);
    sb.push(":");
    sb.push(client._socket.remotePort);
    return sb.join("");
}

// purpose of this interval is to reset isAlive for all cients
const intervalHeartbeat = setInterval(function ping() {
    if (wsServer.clients.length === 0) return;
    
    // notvery sufficient, but only way - iteration through internal structure
    wsServer.clients.forEach(function each(wsClient) {
        if (wsClient.isAlive === false){ // not reachable any more
            console.log("Terminating nonreachable client");
            return wsClient.terminate();
        }
        console.log("Trigering ping to client: " + logClient(wsClient));
        wsClient.isAlive = false; // set to false, heartbeat handler will set it to true
        wsClient.ping(noop); // trigger event   
    });

}, HEARTBEAT_INT_MS);

// start http server
server.listen(process.env.WEB_SRV_PORT, process.env.WEB_SRV_HOST, () => {
    console.log(`Server is running on http://${process.env.WEB_SRV_HOST}:${process.env.WEB_SRV_PORT}`);
});
// serial port: talks to the duino
var serialport = require('serialport'),
	SerialPort = serialport,
	portname = '/dev/ttyACM0'; //process.argv[2]; // to read serial port name from command line

//websocket, ? talks to the browser-side
var WebSocketServer = require('ws').Server;
var SERVER_PORT = 8081;
var wss = new WebSocketServer({port: SERVER_PORT});
var connections = new Array; // handles the multiple connections

//for terminal inputs
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

//--------------------- readline
rl.on('line', (input) => {
	console.log('sent to duino: ' + input);
	myPort.write(input + '\n');
});

//--------------------- SerialPort
var myPort = new SerialPort(portname, { 
	baudrate: 38400,
	dataBits: 8,
	parity: 'none',
	flowControl: false, 
	parser: serialport.parsers.readline("\r\n") // sets readline function to call only when new line
});

myPort.on('open', function() {
	console.log('port is open');
});

myPort.on('close', function() {
	console.log('port is closed');
});

myPort.on('error', function() {
	console.log('error on serialport');
});

myPort.on('data', function(data) {
	// whenever a new data event, as per parser above, when newline and carriage return
	console.log("from arduino: " + data); // ship data to console
	sendToWeb(data);
	// now make decisions and do stuff based on data
});

//--------------------- WebSocketServer

wss.on('connection', handleConnection);

function handleConnection(client) {
	console.log("wss: new connection");
	connections.push(client); // add client to connections array
	
	client.on('message', parseClientMessage); // when we get a message, parse & do stuff
	
	client.on('close', function() {
		console.log("wss: connection closed");
		var position = connections.indexOf(client); // index of connection in array of connections
		connections.splice(position, 1); // remove from array
	});
}

function parseClientMessage(data) { // WILL SEND TO SERIAL
	console.log("wss: data in: " + data);
	//myPort.write(data); // send to arduino over serial
	// only if serial is open? can check? will throw error automatically?
}
	
function sendData(data){ //
	for (connection in connections){ // plurals!
		console.log("sent to connection #: " + connection + " this data: " + data);
		connections[connection].send(data);
	}
}
	
function sendToWeb(data){
	console.log("sentToWeb: "+data);
	if (connections.length > 0) {
		sendData(data);
	}
}

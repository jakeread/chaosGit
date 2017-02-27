var debug = false;

// serial port: talks to the duino
var serialport = require('serialport'),
	SerialPort = serialport,
	portname = '/dev/ttyACM0'; //process.argv[2]; // to read serial port name from command line

//websocket, ? talks to the browser-side
var WebSocketServer = require('ws').Server;
var SERVER_PORT = 8081;
var wss = new WebSocketServer({port: SERVER_PORT});
var connections = new Array; // handles the multiple connections

var confCode = "";
var confMeasure = "";

//for terminal inputs
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

//--------------------- readline
rl.on('line', parseLineIn);

function parseLineIn(data){
	parseUserInput(data);
}

//--------------------- SerialPort
var myPort = new SerialPort(portname, { 
	baudrate: 38400,
	dataBits: 8,
	parity: 'none',
	flowControl: false, 
	parser: serialport.parsers.readline("\r\n") // sets readline function to call only when new line
});

myPort.on('open', function() {
	console.log('Serialport: Open');
});

myPort.on('close', function() {
	console.log('Serialport: Closed');
});

myPort.on('error', function() {
	console.log('Serialport: Error');
});

myPort.on('data', parseTeensyOutput); // on data event, do this function

function parseTeensyOutput(data) { // ----------------- SERIAL IN LANDING
	if(true){
		console.log("teensy output: " + data); // ship data to console
	}
	if(data[0] == "C" || data[0] == "M"){ // kritical for scans
		confCode = data;
		checkConfCode();
	}
	publish(data);
};

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
	if(debug){
		console.log("wss: data in: " + data);
	}
	parseUserInput(data);
}
	
function sendData(data){ //
	for (connection in connections){ // plurals!
		if(debug){
			console.log("sent to connection #: " + connection + " this data: " + data);
		}
		connections[connection].send(data);
	}
}
	
function publish(data){
	if(debug){
		console.log("sentToWeb: "+data);
	}
	if (connections.length > 0) {
		sendData(data);
	}
}

//------------------------ Data Streams

function parseUserInput(data){ // -- commandLine and wss come thru here
	console.log('parseUserInput: ' + data);
	switch(data){
		case "measure":
			writeToPort("M");
			break;
		case "home":
			writeToPort("H");
			break;
		case "scan":
			scan.active = true;
			startScan();
			break
		default:
			writeToPort(data);
	}
}


function writeToPort(data){
	console.log("writing to port: " + data);
	myPort.write(data + '\n');
}

//------------------------ SCANNING

var scan = {
	"a": 0,
	"b": 0,
	"aInterval": 5,
	"bInterval": 5,
	"aEnd": 80,
	"bEnd": 120,
	"aStart": -80,
	"bStart": -120,
	"currentCommand": "",
	"active": false
}

function startScan(){
	scan.a = scan.aStart-scan.aInterval;
	scan.b = scan.bStart-scan.bInterval;
	scan.currentCommand = "B"+scan.b;
	writeToPort(scan.currentCommand);
}

function doScan(){
	console.log("doing scan");
	if (scan.b < scan.bEnd){
		scan.b = scan.b+scan.bInterval;
		scan.currentCommand = "B"+scan.b;
		writeToPort(scan.currentCommand);
	} else {
		scan.b = scan.bStart;
		scan.currentCommand = "B"+scan.b;
		writeToPort(scan.currentCommand);
	}
	if (scan.b == scan.bStart){
		scan.a = scan.a+scan.aInterval;
		scan.currentCommand = "A"+scan.a;
		writeToPort(scan.currentCommand);
	} else if (scan.a > scan.aEnd){
		writeToPort("B0");
		setTimeout(writeToPort, 1000, "A0");
		scan.active = false;
		console.log("SCAN FINISHED");
	}
}

function checkConfCode(){
	if (confCode.includes("M")){
		//console.log("includes M");
		if(scan.active){
			doScan();
		}
	} else if(confCode.includes(scan.currentCommand)){
		//console.log("includes currentCommand")
		if(scan.active){
			writeToPort("M");
		}
	}
	confCode = "";
}

// var commandPrompt = require('./commandPrompt');

var serialport = require('serialport'),
	SerialPort = serialport,
	portname = '/dev/ttyACM0'; //process.argv[2]; // to read serial port name from command line

const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.on('line', (input) => {
	console.log('sent to duino: ' + input);
	myPort.write(input + '\n');
});

var myPort = new SerialPort(portname, { 
	baudrate: 38400,
	dataBits: 8,
	parity: 'none',
	flowControl: false, 
	parser: serialport.parsers.readline("\r\n")
});

// var command = commandPrompt.getCommand();

myPort.on('open', function() {
	// function that happens when port opens
	console.log('port is open');
});

myPort.on('close', function() {
	// function for closing
	console.log('port is closed');
});

myPort.on('error', function() {
	// when error, fires
	console.log('error on serialport');
});

myPort.on('data', function(data) {
	// whenever a new data event, as per parser above, when newline and carriage return
	console.log("from arduino: " + data); // ship data to console
	// now make decisions and do stuff based on data
});



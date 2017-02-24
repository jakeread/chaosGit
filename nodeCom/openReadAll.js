console.log("hello node");

var SerialPort = require('serialport');
var serial = new SerialPort("/dev/ttyACM0");
serial.on('open', function(){
	console.log('Serial Port Opened');
	serial.on('data', function(data){
		console.log(data[0]);
	});
});

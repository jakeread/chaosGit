var socket = new WebSocket("ws://localhost:8081");

var stat;
var lines = new Array;
var dataIn;

var lineIn;

function setup() {
	// createCanvas must be the first statement
	var canvas = createCanvas(690, 600, WEBGL);  
	canvas.position(10,10);
	//stroke(0);     // Set line drawing color to white
	frameRate(24);
	
	// SOCKET
	socket.onopen = openSocket;
	socket.onclose = closeSocket;
	socket.onmessage = newData;
	
	stat = createDiv("Awaiting Status... ");
	stat.position(710, 595);

	dataIn = createDiv("data placeholder");
	dataIn.position(710, 50);

	// INPUT
	lineIn = createInput();
	lineIn.position(710,10);
}

function draw() {
	background(245);   // Set the background to black
	
	orbitControl();
	
	translate(0, 0, -600);
}

function openSocket() {
	socket.send("p5: hello websocket");
	stat.html("Socket Open");
}

function closeSocket() {
	stat.html("Socket Closed")
}

function newData(result) {
	if(result.data[0] == "M"){
		stat.html("DATA IN");
	}
	append(lines, result.data);
	for(line in lines){
		dataIn.html(lines[line]);
	}
}

function keyPressed(){
	if(keyCode == ENTER || keyCode == RETURN){
		socket.send(lineIn.value());
		lineIn.value("");
	}
}
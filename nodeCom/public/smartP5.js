var text;
var y = 100;
var socket = new WebSocket("ws://localhost:8081");

function setup() {
	// createCanvas must be the first statement
	createCanvas(720, 400);  
	stroke(255);     // Set line drawing color to white
	frameRate(30);
	
	socket.onopen = openSocket;
	socket.onmessage = showData;
	
	text = createDiv("Data in: ");
	text.position(0, 420);
}

function draw() {
	background(0);   // Set the background to black
	y = y - 1; 
	if (y < 0) { 
		y = height; 
	} 
	line(0, y, width, y);  
}

function openSocket() {
	socket.send("p5: hello websocket");
	text.html("Socket open");
}

function showData(result) {
	text.html("Data reading: " + result.data);
}

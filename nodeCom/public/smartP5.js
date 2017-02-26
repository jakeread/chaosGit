var socket = new WebSocket("ws://localhost:8081");

var stat;
var lines = [];
var dataIn;

var lineIn;

var dataPoints = new Array(); // array of our datapoint objects

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
	stat.position(710, 500);

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

	if (dataPoints.length > 0){
		for(dataPoint in dataPoints){
			stat.html("dataPoints length: " + dataPoints.length+ "<br> radiant: " + dataPoints[dataPoint].radiant + "<br> position X: " + dataPoints[dataPoint].pos[0]);
		} // add points in this loop, check for dead / outdated points, or fade based on time
	}
}

function openSocket() {
	socket.send("p5: hello websocket");
	stat.html("Socket Open");
}

function closeSocket() {
	stat.html("Socket Closed")
}

function newData(result) {
	dataIn.html("");
	dataIn.html(result.data);
	if(result.data[0] == "M"){
		stat.html("DATA IN");
		var dtp = new dataPoint(result.data);
		dataPoints.push(dtp);
	}
}

function keyPressed(){
	if(keyCode == ENTER || keyCode == RETURN){
		socket.send(lineIn.value());
		lineIn.value("");
	}
}

function dataPoint(data){
	var strAngleA = data.slice(data.indexOf("A")+1, data.indexOf("B"));
	var strAngleB = data.slice(data.indexOf("B")+1, data.indexOf("D"));
	var strDistance = data.slice(data.indexOf("D")+1, data.indexOf("R"));
	var strRadiant = data.slice(data.indexOf("R")+1, data.length);

	this.a = parseFloat(strAngleA);
	this.b = parseFloat(strAngleB);
	this.distance = parseFloat(strDistance);
	this.radiant = parseFloat(strRadiant);

	var x = sin(radians(this.a))*cos(radians(this.b));
	var y = sin(radians(this.a))*sin(radians(this.b));
	var z = cos(radians(this.a));

	this.pos = [-this.distance*x, -this.distance*y, this.distance*z];
}
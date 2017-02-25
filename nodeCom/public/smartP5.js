var text;
var y = 0;
var socket = new WebSocket("ws://localhost:8081");

function setup() {
	// createCanvas must be the first statement
	canvas = createCanvas(710, 400, WEBGL);  
	//stroke(0);     // Set line drawing color to white
	frameRate(24);
	canvas.position(200,5);
	
	socket.onopen = openSocket;
	socket.onmessage = showData;
	
	text = createDiv("Data in: ");
	text.position(5, 5);
}

function draw() {
	background(200);   // Set the background to black
	
	var radius = width * 1.5;
	
	orbitControl();
	
	normalMaterial();
	translate(0, 0, -600);
	for(var i = 0; i <= 12; i++){
		for(var j = 0; j <= 12; j++){
			push();
			var a = j/12 * PI;
			var b = i/12 * PI;
			translate(sin(2 * a) * radius * sin(b), cos(b) * radius / 2 , cos(2 * a) * radius * sin(b));    
			if(j%2 === 0){
				cone(30, 30);
			}else{
				box(30, 30, 30);
			}
			pop();
		}
	}
}

function openSocket() {
	socket.send("p5: hello websocket");
	text.html("Socket open");
}

function showData(result) {
	text.html("Data reading: " + result.data);
}

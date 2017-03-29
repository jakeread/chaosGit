// ----------------------------------- COMMUNICATION

var socket = new WebSocket("ws://localhost:8081");

socket.onopen = openSocket;
socket.onclose = closeSocket;
socket.onmessage = newData;

function openSocket() {
	socket.send("JS openSocket");
	console.log("Socket Open");
}

function closeSocket() {
	console.log("Socket Closed")
}

function newData(result) {  
	console.log(result.data);
	//dataDisplay.html(result.data);
	//if(result.data[0] == "M"){
	//	stat.html("Data in...");
	//	var dtp = dataPoint(result.data); // dataPoint returns object
	//	dataPoints.push(dtp); // puts object in array of objects
	//}
}

// ----------------------------------- TEXT TERMINAL

function handleCommands(input){
	console.log("HANDLING");
	// DO IT WITH EVENTS <------------------
}

document.getElementById('commandIn').addEventListener('keydown', keyPressed); // referencing HTML element we wrote w/ this ID

function keyPressed(event){
	if(event.keyCode == 13){
		event.preventDefault();
		commandLineInput();
	}
}

function commandLineInput(){
	var input = document.getElementById("commandIn").value;
	console.log(input);
	recentLines.add(input);
	handleCommands(input);
	document.getElementById("commandIn").value = ""; // clear input
}

var recentLines = { // lines display obj
	lines: new Array(),

	domLines: document.getElementById("recentLines"),

	add: function(newLine){
		if(this.lines.push(newLine) > 15){
			this.lines.splice(0, 1);
		}
		this.domLines.innerHTML = ""; // clear it
		for(i = 0; i < this.lines.length; i ++){
			this.domLines.innerHTML += this.lines[i] + "</br>"; // re-write
		}
		console.log(this.lines);
	}
}

// ----------------------------------- GRAPHICS

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var camera, controls, scene, renderer;

var width = window.innerWidth-315;
var height = window.innerHeight-25;

// init, animate

initThree();
animate();

function initThree(){
	
	// camera

	camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
	camera.position.z = 5;

	controls = new THREE.TrackballControls(camera, container);

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;	

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [65, 83, 68];

	controls.addEventListener('change', render);

	// werld

	scene = new THREE.Scene();

	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	// renderer

	renderer = new THREE.WebGLRenderer({antialias: false});
	renderer.setSize(width, height);

	container = document.getElementById('container');
	container.appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResize, false);

	render();

}

function onWindowResize(){

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);

	controls.handleResize();

	render();
}

function animate(){
	requestAnimationFrame(animate);
	controls.update();	
}

function render(){
	renderer.render(scene, camera);
}

// ----------------------------------- FIN
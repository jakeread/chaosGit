var debug = true;

// ----------------------------------- COMMUNICATION

var socket = new WebSocket("ws://localhost:8081");

socket.onopen = openSocket;
socket.onclose = closeSocket;
socket.onmessage = newData;

function openSocket() {
	console.log("Socket Open");
}

function closeSocket() {
	console.log("Socket Closed")
}

function newData(result) {  
	var theData = result.data;
	if(debug){console.log("js newData:" + theData);}
	recentLines.add("SNSR: " + theData);
	if(theData[0] == "M"){
		if(debug){console.log("in M-message");}
		var dtp = dataPoint(theData); // dataPoint returns object
		dataPoints.push(dtp); // puts object in array of objects
	}
}

// ----------------------------------- TEXT TERMINAL

function handleCommands(input){
	if(debug){console.log("js handleCommands: " + input);}
	socket.send(input);
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
	if(debug){console.log(input);}
	recentLines.add("USER: "+ input);
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
		if(false){console.log(this.lines);}
	}
}

// ----------------------------------- DATA

var dataPoints = new Array();

function dataPoint(data){ // writes points on receipt of M-messages

	var a = parseFloat(data.slice(data.indexOf("A")+1, data.indexOf("B")));
	var b = parseFloat(data.slice(data.indexOf("B")+1, data.indexOf("D")));
	var distance = parseFloat(data.slice(data.indexOf("D")+1, data.indexOf("R")));
	var radiant = parseFloat(data.slice(data.indexOf("R")+1, data.length));

	var x = Math.sin(Math.radians(b))*Math.cos(Math.radians(-a));
	var y = Math.sin(Math.radians(b))*Math.sin(Math.radians(-a));
	var z = Math.cos(Math.radians(b));

	var pos = {
		"x": -distance*x*100,
		"y": -distance*z*100,
		"z": distance*y*100
	};

	var tempColour = mapTemp(radiant);

	var theDataPoint = {
		"a": a,
		"b": b,
		"distance": distance,
		"radiant": radiant,
		"pos": pos,
		"tc": tempColour
	};

	if(debug){console.log(theDataPoint);}
	threeAddNewPoint(theDataPoint);
	return theDataPoint;
}

function mapTemp(temp) { // used by dataPoint to build temp->color

	var tempMid = 26.5;
	var tempLow = 24.0;
	var tempHigh = 29.0;

	var r, g, b; // for colours

	r = Math.map(temp, tempLow, tempHigh, 0, 255);

    if (temp > tempMid) { 
		g = Math.map(temp, tempMid, tempHigh, 255, 0);
	} else if (temp < tempMid) {
		g = Math.map(temp, tempLow, tempMid, 0, 255);
	} else {
		g = 0;
	}

	b = Math.map(temp, tempLow, tempHigh, 255, 0);

	var tempColour = {
		"r": r,
		"b": b,
		"g": g
	};

	return tempColour;
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
	camera.position.z = 50;

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

function threeAddNewPoint(dataPoint){

	console.log("addNewPoint");

	var position = new Float32Array([dataPoint.pos.x, dataPoint.pos.y, dataPoint.pos.z]);
	var color = new Float32Array(3);
	var size = new Float32Array([200.0]);

	console.log("colors");

	var threeColor = new THREE.Color();
	threeColor.setRGB(dataPoint.tc.r, dataPoint.tc.g, dataPoint.tc.b);
	threeColor.toArray(color, 0);

	console.log("geometry");

	var geometry = new THREE.BufferGeometry();
	geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3) );
	geometry.addAttribute( 'customColor', new THREE.BufferAttribute( color, 3) );
	geometry.addAttribute( 'size', new THREE.BufferAttribute( size, 1) );

	console.log("material");

	var material = new THREE.ShaderMaterial( {
		uniforms: {
			color:   { value: new THREE.Color( 0xffffff ) },
			texture: { value: new THREE.TextureLoader().load( "textures/disc.png" ) }
		},
		vertexShader: document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		alphaTest: 0.9
	} );

	console.log("particle");

	var particle = new THREE.Points(geometry, material);
	scene.add(particle);

	console.log("fin addNewPoint");

}

// ----------------------------------- UTILS

Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
};

Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
};

Math.map = function(value, inLow, inHigh, outLow, outHigh) {
	if(value <= inLow){
		return outLow;
	} else if(value >= inHigh) {
		return outHigh;
	} else {
		return ((value - inLow)/(inHigh - inLow))*(outHigh-outLow)+outLow;
	}
};
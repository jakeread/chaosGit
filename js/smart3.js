var debug = false;

// ----------------------------------------------------------------------------------------------- COMMUNICATION

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

// ----------------------------------------------------------------------------------------------- TEXT TERMINAL

function handleCommands(input){
	if(debug){console.log("js handleCommands: " + input);}
	switch(input){
		default:
			socket.send(input);
			break;
		case "save":
		case "Save":
		case "SAVE":
			saveData(dataPoints);
			break;
		case "load":
		case "Load":
		case "LOAD":
			loadData();
			break;
		case "load pattern":
		case "Load Pattern":
		case "Load pattern":
		case "LOAD PATTERN":
			loadScanPattern();
			break;
		case "scan":
		case "Scan":
		case "SCAN":
			doScan();
			break;
	}
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
		if(debug){console.log(this.lines);}
	}
}

// ----------------------------------------------------------------------------------------------- DATA

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
		"x": -distance*x*1,
		"y": -distance*z*1,
		"z": distance*y*1
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

// ----------------------------------------------------------------------------------------------- DATA MANAGEMENT

var scanPattern;

function loadJSON(callback){
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', './scanParams/pyOutTest.json', true);
	xobj.onreadystatechange = function(){
		if(xobj.readyState == 4 && xobj.status == "200"){
			callback(xobj.responseText);
		}
	}
	xobj.send(null);
}

loadJSON(function(response){
	scanPattern = JSON.parse(response);
	console.log(scanPattern[0]);
	console.log(scanPattern[1]);
})

function saveData(dataArray){
	if (dataArray.length < 1){
		recentLines.add("THR3: dataPoints array is of length 0")
	} else {
		recentLines.add("THR3: saving data...");
		var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataPoints));
		recentLines.add("THR3: " + '<a href="data:' + data + '" download="data.json">Download JSON</a>');
	}
}

function loadData(){
	recentLines.add("THR3: loading not implemented atm");
}

function loadScanPatter(){
	recentLines.add("THR3: loading scans not implemented atm");
}

// ----------------------------------------------------------------------------------------------- SCAN MANAGEMENT

//var jtext = FileReader.readAsText('pyOutTest.json');
//var scanPoints = JSON.parse(jtext);
//var scanPoints = JSON.parse('[{"x":216,"y":58.282525588539},{"x":288,"y": 58.282525588539},{"x":51.3401917459099,"y": 90},{"x":144,"y": 58.282525588539},{"x":180,"y": 90},{"x":72,"y": 58.282525588539},{"x":144,"y": 58.282525588539},{"x":312.436229788535,"y": 90},{"x":0,"y": 58.282525588539},{"x":72,"y": 58.282525588539},{"x":33.146995832256,"y": 90}]');

var currentScan = {

	isRunning: false,

	//scanPoints: scanPoints,

	init: function(){
		this.isRunning = true;
		console.log("Scanning");
	}
}

function doScan(){
	// "just do it"
	// - shia
	currentScan.init();
}

function kickScan(){
	if(currentScan.isRunning){
		// f
	}
}

// ----------------------------------------------------------------------------------------------- GRAPHICS

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
	camera.position.z = 20;

	controls = new THREE.TrackballControls(camera, container);

	controls.rotateSpeed = 2.0;
	controls.zoomSpeed = 2.0;
	controls.panSpeed = 1.2;

	controls.noZoom = false;
	controls.noPan = false;	

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [65, 83, 68];

	controls.addEventListener('change', render);

	// werld

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xfafafa );

	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0xcccccc } );
	material.transparent = true;
	material.opacity = 0.5;
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

	var pointGeometry = new THREE.Geometry();

	var pos = new THREE.Vector3();

	pos.x = dataPoint.pos.x;
	pos.y = dataPoint.pos.y;
	pos.z = dataPoint.pos.z;

	pointGeometry.vertices.push(pos);

	var pointColor = new THREE.Color();
	pointColor.setRGB(dataPoint.tc.r, dataPoint.tc.g, dataPoint.tc.b);

	var pointMaterial = new THREE.PointsMaterial({color: pointColor, size: 0.5})

	var pointField = new THREE.Points( pointGeometry, pointMaterial );

	scene.add( pointField );

	render();

}

// ----------------------------------------------------------------------------------------------- UTILS

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
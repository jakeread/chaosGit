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
	if(theData[0] == "S"){
		scan.doNextPoint();
	}
	if(theData[0] == "M" || theData[1] == "M"){ // ---------------------------------------------- On dataPoint Received
		if(debug){console.log("in M-message");}
		var dtp = dataPoint(theData); // dataPoint returns object
		dataPoints.push(dtp); // puts object in array of objects
		threeNewPoints(); // three updates the set of points now
	}
}

// ----------------------------------------------------------------------------------------------- TEXT TERMINAL

function handleCommands(input){
	if(debug){console.log("js handleCommands: " + input);}
	if (input.indexOf("load scan") == 0) {
		var path = input.substring(input.indexOf("n") + 2);
		loadData(path);
		threeNewPoints();
	} else {
		switch(input){
			default:
				socket.send(input);
				break;
			case "save":
				saveData(dataPoints);
				break;
			case "start scan":
				scan.init();
				break;
		}
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
		if(this.lines.push(newLine) > 30){
			this.lines.splice(0, 1);
		}
		this.domLines.innerHTML = ""; // clear it
		for(i = 0; i < this.lines.length; i ++){
			this.domLines.innerHTML += this.lines[i] + "</br>"; // re-write
		}
		if(debug){console.log(this.lines);}
	}
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
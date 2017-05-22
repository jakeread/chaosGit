var debug = false;

var start_btn = document.getElementById('start_btn');
var load_scan_btn = document.getElementById('load_scan_btn');
var load_pattern_btn = document.getElementById('load_pattern_btn');
var stop_btn = document.getElementById('stop_btn');
var dynamic_scroll = document.getElementById('recentLines');

document.getElementById('load_btn').onclick = function () {
	document.getElementById('pattern_file_input').click();
};

document.getElementById('load_scan_btn').onclick = function () {
	document.getElementById('scan_file_input').click();
};

// ----------------------------------------------------------------------------------------------- COMMUNICATION

var socket = new WebSocket("ws://localhost:8081");

socket.onopen = openSocket;
socket.onclose = closeSocket;
socket.onmessage = newData;

function openSocket() {
	console.log("Socket Open");
}

function closeSocket() {
	console.log("Socket Closed");
}

/**
 * Reads and handles new data from pipe. Pushes new data to
 * dataPoints array and updates three.js display.
 */
function newData(result) {
	var theData = result.data;
	if (debug) {
		console.log("js newData:" + theData);
	}
	if (theData.indexOf("Unknown Code in Command") === 0) {
		recentLines.add("Unknown Command");
	} else {
		recentLines.add(theData);
	}
	if (theData[0] == "S") {
		scan.doNextPoint();
	}
	if (theData[0] == "M" || theData[1] == "M") { // ---------------------------------------------- On dataPoint Received
		if (debug) {
			console.log("in M-message");
		}
		var dtp = dataPoint(theData); // dataPoint returns object
		dataPoints.push(dtp); // puts object in array of objects
		threeNewPoints(); // three updates the set of points now
	}
}

// ----------------------------------------------------------------------------------------------- TEXT TERMINAL
/**
 * Handles incoming commands from the browser UI
 * @param  {string} input - command line input from browser UI
 */
function handleCommands(input) {
	var path;
	if (debug) {
		console.log("js handleCommands: " + input);
	}
	if (input.indexOf("load scan") === 0) {
		path = input.substring(input.indexOf("n") + 2);
		loadData(path);
		threeNewPoints();
	} else if (input.indexOf("load pattern") === 0) {
		path = input.substring(input.indexOf("n") + 2);
		loadPattern(path);
		recentLines.add("Pattern loaded");
	} else {
		switch (input) {
			default: socket.send(input);
			break;
		case "save":
				saveData(dataPoints);
			break;
		case "start scan":
				scan.init();
			break;
		case "pause scan":
				_stop = true;
		}
	}
}

document.getElementById('commandIn').addEventListener('keydown', keyPressed); // referencing HTML element we wrote w/ this ID

function keyPressed(event) {
	if (event.keyCode == 13) {
		event.preventDefault();
		commandLineInput();
	}
}

/**
 * Handles input from browser UI command line. Calls handleCommands()
 */
function commandLineInput() {
	var input = document.getElementById("commandIn").value;
	if (debug) {
		console.log(input);
	}
	recentLines.add("USER: " + input);
	handleCommands(input);
	document.getElementById("commandIn").value = ""; // clear input
}

/**
 * recentLines object displays command line history in browser UI
 */
var recentLines = { // lines display obj
	lines: [],

	domLines: document.getElementById("recentLines"),

	add: function (newLine) {
		if (this.lines.push(newLine) > 50) {
			this.lines.splice(0, 1);
		}
		this.domLines.innerHTML = ""; // clear it
		for (i = 0; i < this.lines.length; i++) {
			this.domLines.innerHTML += this.lines[i] + "</br>"; // re-write
		}
		if (debug) {
			console.log(this.lines);
		}
		updateScroll();
	}
};

/**
 * Updates recentLines scroll to ensure most recent command is at the bottom
 */
function updateScroll() {
	var element = document.getElementById("recentLines");
	element.scrollTop = element.scrollHeight;
}

// ----------------------------------------------------------------------------------------------- UTILS

Math.radians = function (degrees) {
	return degrees * Math.PI / 180;
};

Math.degrees = function (radians) {
	return radians * 180 / Math.PI;
};

/**
 * Helper function to map value onto specified range
 * @param   value   value to map
 * @param   inLow   minimum of initial range
 * @param   inHigh  maximum of initial range
 * @param   outLow  minimum of range to map onto
 * @param   outHigh maximum of range to map onto
 * @return          mapped value
 */
Math.map = function (value, inLow, inHigh, outLow, outHigh) {
	if (value <= inLow) {
		return outLow;
	} else if (value >= inHigh) {
		return outHigh;
	} else {
		return ((value - inLow) / (inHigh - inLow)) * (outHigh - outLow) + outLow;
	}
};

function call_start() {
	handleCommands("start scan");
}

/**
 * Set _stop flag to true
 */
function call_stop() {
	_stop = true;
}

/**
 * Load scan pattern from local file
 * @param  {event} e - event from file input
 */
function loadPatternFile(e) {
	var file = e.target.files[0];
	if (!file) {
		return;
	}
	var reader = new FileReader();
	reader.onload = function (e) {
		var contents = e.target.result;
		scanPattern = JSON.parse(contents);
		recentLines.add("Scan Pattern Loaded");
	};
	reader.readAsText(file);
}

/**
 * Load scan from local file for visualization
 * @param  {event} e - event from file input
 */
function loadScanFile(e) {
	var file = e.target.files[0];
	if (!file) {
		return;
	}
	var reader = new FileReader();
	reader.onload = function (e) {
		var contents = e.target.result;
		dataPoints = JSON.parse(contents);
		recentLines.add("Scan Loaded");
		threeNewPoints();
	};
	reader.readAsText(file);
}

start_btn.onclick = call_start;
stop_btn.onclick = call_stop;
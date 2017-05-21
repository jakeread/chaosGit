// ----------------------------------------------------------------------------------------------- SCAN MANAGEMENT

var scanPattern;
var startTime;
var endTime;

function loadPattern(path) {
	var response;
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	var filePath = './scanParams/' + path;

	xobj.open('GET', filePath, true);
	xobj.onreadystatechange = function() {
		if (xobj.readyState == 4) {
			scanPattern = JSON.parse(xobj.responseText);
			sortPattern();
		}
	}
	xobj.send(null);
}

function sortPattern() {
	var newScanPattern = [];
	var threshold = 5; // width of path
	for (var j = 0; j <= 360; j = j + threshold) {
		var scanPass = [];
		for (var i = 0; i < scanPattern.length; i++) {
			if (scanPattern[i].a >= j && scanPattern[i].a < j + threshold) {
				scanPass = scanPass.concat(scanPattern[i]);
			}
		}
		for (var k = 0; k < scanPass.length; k++) {
			newScanPattern = newScanPattern.concat(scanPass[k]);
		}
	}
	scanPattern = newScanPattern;
}

function loadJSON(callback) {
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', './scanParams/6v-scanPoints.json', true);
	xobj.onreadystatechange = function() {
		if (xobj.readyState == 4) {
			callback(xobj.responseText);
		}
	}
	xobj.send(null);
}

loadJSON(function(response) {
	scanPattern = JSON.parse(response);
	console.log("scanPattern Loaded, length: " + scanPattern.length);
	sortPattern();
	console.log("scanPattern sorted");
});

var scan = {

	"isRunning": false,

	"scanPosition": 0, // index of current point in scanPattern

	prepare: function() {
		console.log("load scan...");
		recentLines.add("THR3: Perparing Scan ...");
		console.log(scanPattern);
	},

	init: function() {
		this.isRunning = true;
		recentLines.add("THR3: Scanning...");
		startTime = new Date().getTime();
		this.doNextPoint();
	},

	doNextPoint: function() {
		if (this.isRunning) {
			while (this.doBoundsCheck(scanPattern[this.scanPosition].a, scanPattern[this.scanPosition].b)) {
				recentLines.add("THR3: Throwing point: due to OOB");
				console.log("throwing point" + this.scanPosition + "due to OOB");
				this.scanPosition++;
			}
			var nextA = scanPattern[this.scanPosition].a;
			var nextB = scanPattern[this.scanPosition].b;
			socket.send("MS" + "A" + nextA + "B" + nextB);
			this.scanPosition++; // done here, next serial-recept with letter 'S' will trigger this f'n again

			if (this.scanPosition >= scanPattern.length) {
				this.isRunning = false;
				endTime = new Date().getTime();
			}
			// setup wait
		} else {
			this.finish();
		}
	},

	finish: function() {
		socket.send("A0B0");
		recentLines.add("THR3: Scan is complete ")
		recentLines.add("Scan took " + (endTime - startTime) / 1000 + " seconds to complete");
	},

	doBoundsCheck: function(a, b) {
		var aBounds = [-5, 365];
		var bBounds = [-95, 95];
		if (a < aBounds[0] || a > aBounds[1] || b < bBounds[0] || b > bBounds[1]) {
			return true;
		} else {
			return false;
		}
	},
}
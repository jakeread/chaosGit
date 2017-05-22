// ----------------------------------------------------------------------------------------------- DATA

var dataPoints = [];

/**
 * Creates datapoint object from data
 * @param  data - data for datapoint
 * @return       datapoint object
 */
function dataPoint(data) { // writes points on receipt of M-messages

	var a = parseFloat(data.slice(data.indexOf("A") + 1, data.indexOf("B")));
	var b = parseFloat(data.slice(data.indexOf("B") + 1, data.indexOf("D")));
	var distance = parseFloat(data.slice(data.indexOf("D") + 1, data.indexOf("R")));
	var radiant = parseFloat(data.slice(data.indexOf("R") + 1, data.length));

	var pos = {
		"x": distance * Math.cos(Math.radians(b)) * Math.cos(Math.radians(a)),
		"y": distance * Math.cos(Math.radians(b)) * Math.sin(Math.radians(a)),
		"z": Math.sin(Math.radians(b)) * distance
	};

	var theDataPoint = {
		"a": a,
		"b": b,
		"distance": distance,
		"radiant": radiant,
		"pos": pos,
	};

	if (debug) {
		console.log(theDataPoint);
	}
	return theDataPoint;
}

/**
 * Saves data
 */
function saveData() {
	if (dataPoints.length < 1) {
		recentLines.add("No data to save");
	} else {
		recentLines.add("Saving data...");
		var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataPoints));
		recentLines.add('<a href="data:' + data + '" download="data.json">Download JSON</a>'); // auto-name with date
	}
}

/**
 * Load scan data from local file
 * @param  {string} path - file path to data
 */
function loadData(path) {
	var response;
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	var filePath = './completedScans/' + path;

	xobj.open('GET', filePath, true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4) {
			dataPoints = JSON.parse(xobj.responseText);
			threeNewPoints();
		}
	};
	xobj.send(null);
}
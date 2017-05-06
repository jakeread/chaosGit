
// ----------------------------------------------------------------------------------------------- DATA

var dataPoints = new Array();

function dataPoint(data){ // writes points on receipt of M-messages

	var a = parseFloat(data.slice(data.indexOf("A")+1, data.indexOf("B")));
	var b = parseFloat(data.slice(data.indexOf("B")+1, data.indexOf("D")));
	var distance = parseFloat(data.slice(data.indexOf("D")+1, data.indexOf("R")));
	var radiant = parseFloat(data.slice(data.indexOf("R")+1, data.length));

	var pos = {
		"x": distance*Math.cos(Math.radians(b))*Math.cos(Math.radians(a)),
		"y": distance*Math.cos(Math.radians(b))*Math.sin(Math.radians(a)),
		"z": Math.sin(Math.radians(b))*distance
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
	return theDataPoint;
}

function saveData(){
	if (dataPoints.length < 1){
		recentLines.add("THR3: dataPoints array is of length 0")
	} else {
		recentLines.add("THR3: saving data...");
		var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataPoints));
		recentLines.add("THR3: " + '<a href="data:' + data + '" download="data.json">Download JSON</a>');
	}
}

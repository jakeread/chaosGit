
// ----------------------------------------------------------------------------------------------- SCAN MANAGEMENT

var scanPattern;

function loadJSON(callback){
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', './scanParams/6v-scanPoints.json', true);
	xobj.onreadystatechange = function(){
		if(xobj.readyState == 4){
			callback(xobj.responseText);
		}
	}
	xobj.send(null);
}

loadJSON(function(response){
	scanPattern = JSON.parse(response);
	console.log("scanPattern Loaded, length: " + scanPattern.length);
	///* nosort bc rectang is already sorted
	scanPattern.sort(function(a,b){ // the basic of basics sort -> should optimize in 2d :/
		return a.a-b.a;
	})
	// */
	console.log("scanPattern sorted");
});

var scan = {

	"isRunning": false,

	"scanPosition": 0, // index of current point in scanPattern

	prepare: function(){
		console.log("load scan...");
		recentLines.add("THR3: Perparing Scan ...");
		console.log(scanPattern);
	},

	init: function(){
		this.isRunning = true;
		recentLines.add("THR3: Scanning...");
		this.doNextPoint();
	},

	doNextPoint: function(){
		recentLines.add("Doing next point");
		recentLines.add("isRunning is: " + this.isRunning);
		if(this.isRunning){
			while(this.doBoundsCheck(scanPattern[this.scanPosition].a, scanPattern[this.scanPosition].b)){
				recentLines.add("THR3: Throwing point: due to OOB");
				console.log("throwing point" + this.scanPosition + "due to OOB");
				this.scanPosition ++;
			}
			recentLines.add("Below while loop");
			var nextA = scanPattern[this.scanPosition].a;
			var nextB = scanPattern[this.scanPosition].b;
			socket.send("MS" + "A" + nextA + "B" + nextB);
			this.scanPosition ++; // done here, next serial-recept with letter 'S' will trigger this f'n again

			if(this.scanPosition >= scanPattern.length){
				this.isRunning = false;
			}
			// setup wait
		} else {
			this.finish();
		}
	},

	finish: function(){
		socket.send("A0B0");
		recentLines.add("THR3: Scan is complete ")
	},

	doBoundsCheck: function(a,b){
		var aBounds = [-5, 365];
		var bBounds = [-95, 95];
		if(a < aBounds[0] || a > aBounds[1] || b < bBounds [0] || b > bBounds[1]){
			return true;
		} else {
			return false;
		}
	},
}

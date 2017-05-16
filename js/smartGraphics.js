
// ----------------------------------------------------------------------------------------------- GRAPHICS

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var camera, controls, scene, renderer, cloud, uniforms;

var width = window.innerWidth-315;
var height = window.innerHeight-25;

// init, animate

initThree();
initThreePointCloud();
animate();

function initThree(){

	// camera

	camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
	camera.position.x = 5;
	camera.position.y = -5;
	camera.position.z = 5;
	camera.lookAt(0,0,0);
	camera.up.set(0,0,1);

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
	scene.background = new THREE.Color( 0xdcdcdc );

	var origin = new THREE.AxisHelper( 1 );
	origin.position.set(0,0,0);
	scene.add( origin );

	// renderer

	renderer = new THREE.WebGLRenderer({antialias: true});
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

var maxmax = 45;
var minmin = 10;

function threeNewPoints(){

	var alphas = cloud.geometry.attributes.alpha;
	var count = alphas.count;
	var positions = cloud.geometry.attributes.position;
	var customColors = cloud.geometry.attributes.customColor;

	var min = 100;
	var max = 0;

	for(var i = 0; i < dataPoints.length; i ++){
		var eval = dataPoints[i].radiant;
		if (eval > max && eval < maxmax){
			max = eval;
		}
		if (eval < min && eval > minmin){
			min = eval;
		}
	}

	for(var i = 0; i < dataPoints.length; i ++){

		alphas.array[i] = 1; // set all points in cloud w/ dataPoint equiv to visible
		positions.array[i*3] = dataPoints[i].pos.x;
		positions.array[i*3 + 1] = dataPoints[i].pos.y;
		positions.array[i*3 + 2] = dataPoints[i].pos.z;

		var tempColor = mapTemp(min, max, dataPoints[i].radiant);
		customColors.array[i*3] = tempColor.r;
		customColors.array[i*3 + 1] = tempColor.g;
		customColors.array[i*3 + 2] = tempColor.b;

		/*
		console.log("customColors: i*3: " + i*3 +
				"\narray[i*3]: " + customColors.array[i*3] +
				"\narray[i*3 + 1]: " + customColors.array[i*3 +1] +
				"\narray[i*3 + 2]: " + customColors.array[i*3 +2] );
		*/
	}

	alphas.needsUpdate = true;
	positions.needsUpdate = true;
	customColors.needsUpdate = true;

	render();

}

function initThreePointCloud(){

	// we'll make a lot, only display those we have data for
	numPoints = 8192;

	// geometry object
	var pointCloudGeometry = new THREE.BufferGeometry();

	// filling geometry
	var alphas = new Float32Array(numPoints);
	var positions = new Float32Array(numPoints * 3);	// x, y, z
	var colors = new Float32Array(numPoints * 3); 		// r, g, b

	var baseColor = new THREE.Color();

	for(var i = 0; i < numPoints; i++){
		alphas[i] = 0;
		positions[i*3] = 0;		// x
		positions[i*3 + 1] = 0;	// y
		positions[i*3 + 2] = 0;	// z

		baseColor.setRGB(255,0,0);
		baseColor.toArray( colors, i * 3);
	}

	pointCloudGeometry.addAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
	pointCloudGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	pointCloudGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));

	// shader / material

	uniforms = {
		color: { value: new THREE.Color(0xffffff)},
	};

	var shaderMaterial = new THREE.ShaderMaterial({

		uniforms: uniforms,
		vertexShader: document.getElementById('vertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent,
		transparent: true,

		alphaTest : 0.9

	});

	// making the THREE pointcloud object
	cloud = new THREE.Points(pointCloudGeometry, shaderMaterial);

	scene.add(cloud);

}

function mapTemp(low, high, eval) { // used by dataPoint to build temp->color

	var tempLow = low;
	var tempHigh = high;
	var tempMid = (high - low) / 2 + low;

	var r, g, b; // for colours

	r = Math.map(eval, tempMid, tempHigh, 0, 1); // THREE dishes RGB's 0-1 when writing direct to buffer

    if (eval > tempMid) {
		g = Math.map(eval, tempMid, tempHigh, 1, 0);
	} else if (eval < tempMid) {
		g = Math.map(eval, tempLow, tempMid, 0, 1);
	} else {
		g = 0;
	}

	b = Math.map(eval, tempLow, tempMid, 1, 0);

	var tempColour = {
		"r": r,
		"b": b,
		"g": g
	};

	return tempColour;
}
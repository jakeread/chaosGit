// ----------------------------------------------------------------------------------------------- GRAPHICS

if (!Detector.webgl) Detector.addGetWebGLMessage();

var container;
var camera, controls, scene, renderer, cloud, uniforms;

var width = window.innerWidth - 315;
var height = window.innerHeight - 25;

// init, animate

initThree();
initThreePointCloud();
animate();

/**
 * Primary three js function
 */
function initThree() {

	// camera
	camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
	camera.position.x = 5;
	camera.position.y = -5;
	camera.position.z = 5;
	camera.lookAt(0, 0, 0);
	camera.up.set(0, 0, 1);

	controls = new THREE.OrbitControls(camera, container);
	//controls = new THREE.TrackballControls(camera, container);
	//controls = new THREE.FirstPersonControls(camera, container);
	/*controls.rotateSpeed = 2.0;
	controls.zoomSpeed = 2.0;
	controls.panSpeed = 1.2;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [65, 83, 68];
*/
	controls.addEventListener('change', render);

	// werld
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xdcdcdc);

	var origin = new THREE.AxisHelper(1);
	origin.position.set(0, 0, 0);
	scene.add(origin);

	// renderer
	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setSize(width, height);

	container = document.getElementById('container');
	container.appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResize, false);

	render();

}

/**
 * Resize and render visualization when window is resized
 */
function onWindowResize() {
	camera.aspect = ((window.innerWidth - 315) / (window.innerHeight - 25));
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth - 315, window.innerHeight - 25);

	controls.handleResize();

	render();
}

/**
 * Helper function for animation
 */
function animate() {
	requestAnimationFrame(animate);
	controls.update();
}

/**
 * Helper function to re-render visualization
 */
function render() {
	renderer.render(scene, camera);
}

var maxmax = 45;
var minmin = 10;

/**
 * Update visualization by adding additional points
 */
function threeNewPoints() {

	var alphas = cloud.geometry.attributes.alpha;
	var count = alphas.count;
	var positions = cloud.geometry.attributes.position;
	var customColors = cloud.geometry.attributes.customColor;

	var min = 100;
	var max = 0;

	for (var i = 0; i < dataPoints.length; i++) {
		var point = dataPoints[i].radiant;
		if (point > max && point < maxmax) {
			max = point;
		}
		if (point < min && point > minmin) {
			min = point;
		}
	}

	for (var j = 0; j < dataPoints.length; j++) {
		alphas.array[j] = 1; // set all points in cloud w/ dataPoint equiv to visible
		positions.array[j * 3] = dataPoints[j].pos.x;
		positions.array[j * 3 + 1] = dataPoints[j].pos.y;
		positions.array[j * 3 + 2] = dataPoints[j].pos.z;

		var tempColor = mapTemp(min, max, dataPoints[j].radiant);
		customColors.array[j * 3] = tempColor.r;
		customColors.array[j * 3 + 1] = tempColor.g;
		customColors.array[j * 3 + 2] = tempColor.b;

		/*
		console.log("customColors: j*3: " + j*3 +
				"\narray[j*3]: " + customColors.array[j*3] +
				"\narray[j*3 + 1]: " + customColors.array[j*3 +1] +
				"\narray[j*3 + 2]: " + customColors.array[j*3 +2] );
		*/
	}

	alphas.needsUpdate = true;
	positions.needsUpdate = true;
	customColors.needsUpdate = true;

	render();
}

/**
 * Create three js point cloud
 */
function initThreePointCloud() {

	// we'll make a lot, only display those we have data for
	numPoints = 8192;

	// geometry object
	var pointCloudGeometry = new THREE.BufferGeometry();

	// filling geometry
	var alphas = new Float32Array(numPoints);
	var positions = new Float32Array(numPoints * 3); // x, y, z
	var colors = new Float32Array(numPoints * 3); // r, g, b

	var baseColor = new THREE.Color();

	for (var i = 0; i < numPoints; i++) {
		alphas[i] = 0;
		positions[i * 3] = 0; // x
		positions[i * 3 + 1] = 0; // y
		positions[i * 3 + 2] = 0; // z

		baseColor.setRGB(255, 0, 0);
		baseColor.toArray(colors, i * 3);
	}

	pointCloudGeometry.addAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
	pointCloudGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	pointCloudGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));

	// shader / material
	uniforms = {
		color: {
			value: new THREE.Color(0xffffff)
		},
	};

	var shaderMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: document.getElementById('vertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent,
		transparent: true,

		alphaTest: 0.9

	});

	// making the THREE pointcloud object
	cloud = new THREE.Points(pointCloudGeometry, shaderMaterial);

	scene.add(cloud);
}

/**
 * Returns a color value based on the temperature of a given point. Used by
 * dataPoint to get colors for points
 *
 * Algorithm converts each value to a log scale and uses functions of the form
 * f(x) = +/- 4.16(x +/- C) to map log values to individual r, g and b values.
 *
 * @param  {float} low   - lowest temperature recorded.
 * @param  {float} high  - highest temperature recorded
 * @param  {float} point  - temperature to evaluate
 * @return {object}      - RGB values of color
 */
function mapTemp(low, high, point) { // used by dataPoint to build temp->color

	var tempLow = Math.log(low);
	var tempHigh = Math.log(high);
	var tempMid = (tempHigh - tempLow) / 2 + tempLow;
	var tempPoint = Math.log(point);
	var rValue, gValue, bValue;

	var r, g, b;

	tempValue = Math.map(tempPoint, tempLow, tempHigh, 0, 1);


	switch (true) {
	case (0 < tempValue && tempValue <= 0.12):
		b = 4.16 * (tempValue + 0.12);
		break;
	case (0.12 < tempValue && tempValue <= 0.38):
		b = 1;
		break;
	case (0.36 < tempValue && tempValue <= 0.62):
		b = -4.16 * (tempValue - 0.62);
		break;
	default:
		b = 0;
	}

	switch (true) {
	case (0.14 < tempValue && tempValue <= 0.38):
		g = 4.16 * (tempValue - 0.14);
		break;
	case (0.38 < tempValue && tempValue <= 0.62):
		g = 1;
		break;
	case (0.62 < tempValue && tempValue <= 0.86):
		g = -4.16 * (tempValue - 0.88);
		break;
	default:
		g = 0;
	}

	switch (true) {
	case (0.38 < tempValue && tempValue <= 0.62):
		r = 4.16 * (tempValue - 0.38);
		break;
	case (0.62 < tempValue && tempValue <= 0.88):
		r = 1;
		break;
	case (0.86 < tempValue && tempValue <= 1):
		r = -4.16 * (tempValue - 1.1);
		break;
	default:
		r = 0;
	}

	var tempColour = {
		"r": r,
		"b": b,
		"g": g
	};

	return tempColour;
}
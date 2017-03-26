repo for smart.princeton.edu  
// todo:  
(1) rebuild for three.js  
(2) save / read json, csv  
(3) reasonable camera controls  
(4) sensible serial terminal  

Installing:  
**Teensyduino** for ardCom/smartMachine  
> does sensor readings, position-having  
**Node.js** for nodeCom/main.js  
> pipe for websockets <-> serialport  
	*> install node on your machine*  
		*> in Terminal:*  
		npm install serialport  
		npm install --save ws  
		*> in Terminal*  
		cd /Path-To-This-Repo/nodeCom  
		node main.js  
**Broswer** to launch browserCom/index.html
> does UI with three.js  
## repo for smart.princeton.edu  
>// todo:  
(1) serial communication more better 
(2) save / read json, csv  

## Installing:  
**Teensyduino** for arduino/smartMachine  
- does sensor readings, position-having  

**Node.js** for pipe.js & lstprts.js   
- pipe.js for websockets <-> serialport  
	- *install node on your machine*  
		- *in Terminal:*  
		- npm install serialport  
		- npm install --save ws  
		- cd /Path-To-This-Repo/nodeCom  
		- node main.js  
- lstprts.js will list all usb ports, update pipe.js portname var accordingly

**Broswer** to launch index.html
- does UI with three.js  

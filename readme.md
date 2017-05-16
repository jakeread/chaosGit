## Repo for S.M.A.R.T Sensor
More information available here: www.smart.princeton.edu

## Installation:
**Teensyduino** for arduino control and sensor readings
- Available here: https://www.pjrc.com/teensy/td_download.html

**Node.js** for pipe.js & lstprts.js
- Available here: https://nodejs.org/en/download/
#####Setup:
- `npm install serialport`
- `npm install --save ws`
- `cd /<path-to-this-repo>/nodeCom`
- `node main.js`
- run `node lstprts.js` to list all usb ports. Select the correct name and update `pipe.js` port name variable accordingly.

##Usage:
- Run `node pipe`
    - Will get `PIPE: Serialport Error` if USB is not connected
- Open `index.html` in browser
    - Used to display three.js visualization
- Run commands using console in browser
    - See commands documentation below

###Commands:
- `L`: Toggle laser on or off
- `H`: Move to home position
- `A<Degree>`: Move servo A (rotates around vertical axis) to the position indicated by <Degree>
    - For example: `A10` will move A to 10 degrees from the normal
- `B<Degree>`: Move servo B (rotates around horizontal axis) to the position indicated by <Degree>
    - For example: `B80` will move B to 80 degrees from the normal
- `start scan`: will begin a scan using the scan pattern set in `smartScanning.js`
- `load scan`: select a scan pattern (To be implemented)

##Todo:
1. Select scan pattern through UI
2. Improve serial communication
3. Save / Read JSON, CSV
4. Improve coloring of points


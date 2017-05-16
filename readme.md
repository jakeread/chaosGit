## Repo for S.M.A.R.T Sensor
More information available here: https://smart.princeton.edu/

## Installation:
**Teensyduino** for arduino control and sensor readings
- Available here: https://www.pjrc.com/teensy/td_download.html

**Node.js** for `pipe.js` & `lstprts.js`
- Available here: https://nodejs.org/en/download/

#### Setup:
- `npm install serialport`
- `npm install --save ws`
- `cd /<path-to-this-repo>/nodeCom`
- `node main.js`
- run `node lstprts.js` to list all usb ports. Select the correct name and update `pipe.js` port name variable accordingly.

## Usage:
- Run `node pipe`
    - Will get `PIPE: Serialport Error` if USB is not connected
- Open `index.html` in browser
    - Used to display three.js visualization
- Run commands using console in browser
    - See commands documentation below

#### Commands:
- `L`: Toggle laser on or off
- `H`: Move to home position
- `C`: Disables stepper motors
- `E`: Enables stepper motors
- `A<degree>`: Move servo A (rotates around vertical axis) to the position indicated by <Degree>
    - For example: `A10` will move A to 10 degrees from the normal
- `B<degree>`: Move servo B (rotates around horizontal axis) to the position indicated by <Degree>
    - For example: `B80` will move B to 80 degrees from the normal
- `M`: Take a complete measurement at current position, point will be added to dataset
- `R`: Take a mylexis reading at current position
- `D`: Take a lidar reading at current position
- `start scan`: will begin a scan using the scan pattern set in `js/jsmartScanning.js`
- `load scan <scan name>`: load a scan JSON into browser visualization. Scans should be stored in the `completedScans` directory.
    - For example: `load scan f1rst-6v-2017_05_05-studioLABIA.json`

## Todo:
1. Select scan pattern through UI
2. Improve serial communication
3. Save / Read JSON, CSV
4. Improve coloring of points
5. Do MRT Calculation in-interface
6. Improve Homing Routine in Smart Machine

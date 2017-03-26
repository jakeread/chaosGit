/**
 * Simple Read
 * 
 * Read data from the serial port and change the color of a rectangle
 * when a switch connected to a Wiring or Arduino board is pressed and released.
 * This example works with the Wiring / Arduino program that follows below.
 */


import processing.serial.*;

Serial myPort;  // Create object from Serial class
int val;      // Data received from the serial port

String inBuffer;

// temp vars
float arrBuffer[];
int kIndex;
int iIndex;

float[][] dist = new float[68][34]; //always at k, i (servo, dyna angles -> *5);
float[][] temp = new float[68][34];

float x, y, z;
float r, g, b, theTemp, tempMid;
float tempLow = 19.0;
float tempHigh = 27.0;

float FOV = 5.4;

float radius = 300;

float viewMult;
float yNormalize;

void setup()
{
  //size(600, 600, P3D);
  fullScreen(P3D);
  viewMult = 4;
  yNormalize = width/height*2;
  // I know that the first port in the serial list on my mac
  // is always my  FTDI adaptor, so I open Serial.list()[0].
  // On Windows machines, this generally opens COM1.
  // Open whatever port is the one you're using. 

  String portName = Serial.list()[1];
 myPort = new Serial(this, portName, 115200);

  tempMid = tempLow + (tempHigh-tempLow)/2;
}

void draw()
{
  doBufferRead();

  background(0);
  camera(-width/2*viewMult+mouseX*viewMult, -height/2*viewMult*yNormalize+mouseY*viewMult*yNormalize, width, 0, 0, 0, 0, 1, 0); // locX, locY, locZ, targX, targY, targZ
  stroke(255);
  noFill();
  for (int k = 0; k<68; k++) {
    for (int i = 0; i<34; i++) {
      //stroke(200);
      if (temp[k][i] != 0) { // if non-0 temp, set colors
        theTemp = temp[k][i];
        r = map(theTemp, tempLow, tempHigh, 0, 255);
        // g's
        if (theTemp > tempMid) { // greater than midpoint
          g = map(theTemp, tempMid, tempHigh, 255, 0);
        } else if (theTemp < tempMid) {
          g = map(theTemp, tempLow, tempMid, 0, 255);
        } else {
          g = 0;
        }
        b = map(theTemp, tempLow, tempHigh, 255, 0);
        stroke(r, g, b); // all zeroes to start
        strokeWeight(3);
      } else {
        stroke(204); // or set to grey
        strokeWeight(1);
      }
      if (dist[k][i] != 0) {
        radius = dist[k][i]*2;
        //println("hit Distance"); 
      } else {
        radius = 1500;
      }
      x = sin(radians(i*FOV))*cos(radians(-k*FOV));
      y = sin(radians(i*FOV))*sin(radians(-k*FOV));
      z = cos(radians(i*FOV));
      point(-radius*x, -radius*z, radius*y);
      // don't print you'll crash it!
    }
  }
  //println("firstDistance", dist[0][0]);
  strokeWeight(1);
  stroke(255, 10);
  box(900);
}

void doBufferRead() {
  if (myPort.available() > 0) {  // If data is available,
    inBuffer = myPort.readString(); // get the buffer (should be one list of vars)
    if (inBuffer != null) {
      //print(inBuffer);
      arrBuffer = float(split(inBuffer, ","));
      if (arrBuffer.length != 4) {
        println("incoming arrBuffer is not of length 4");
      } else {
        kIndex = int(arrBuffer[0]);
        iIndex = int(arrBuffer[1]);
        if (kIndex <= 68 && iIndex <= 34) {
          if (!Float.isNaN(arrBuffer[2])) {
            dist[kIndex][iIndex] = arrBuffer[2]; // bails on 2nd write...
            //println("dist[k][i]", kIndex, iIndex, arrBuffer[2]);
          }
          if (!Float.isNaN(arrBuffer[3])) {
            temp[kIndex][iIndex] = arrBuffer[3]; // freeze
            //println("temp[k][i]", kIndex, iIndex, arrBuffer[3]);
          }
          // println("kIndex", kIndex, "iIndex", iIndex, "dist", arrBuffer[2], "temp", arrBuffer[3]);
        } else {
          println("incoming arrBuffer indices out of range");
        }
      }
    }
  }
}
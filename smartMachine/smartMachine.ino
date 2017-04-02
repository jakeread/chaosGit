#include <AccelStepper.h>
#include <Adafruit_MLX90614.h>
#include <Metro.h>
#include "cmdStruct.h"

//steppers
AccelStepper stepperA(AccelStepper::DRIVER, 6, 5);
AccelStepper stepperB(AccelStepper::DRIVER, 11, 10);
#define stepEnA 9
#define stepEnB 12
#define stepLimitA 7
#define stepLimitB 8
#define stepsPerDegA 40.1
#define stepsPerDegB 28.8
#define degWhenHomedA 10
#define degWhenHomedB -100
#define stepHomeSpeed 1000
boolean stepEnabled = false;

#define debug false

//mlx
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

//lidar
unsigned long pulseWidth;
#define lidarMode 16
#define lidarMonitor 15

//flashing lights
#define statusLed 13

//laser beam
#define lzr 14

// command business
CMD command; 
String buffString;
// singular instance of command struct
// were we doing this properly, a buffer of these


// timer, to c if u hang 10
Metro hanger = Metro(25);

void setup() {
  Serial.begin(115200);
  if(debug){
    Serial.println("init");
  }

  command.ogString.reserve(512); // reserve bytes for the string

  initSteppers();
  initLidar();
  initSwitches();
  initMLX();
}

void loop() {
  if (command.isReady) {
    commandDispatch(); // at this point we are one-at-a-time command execution with no buffers :|
  }
  if (hanger.check() == 1) {
    flash(statusLed);
  }
}

// ----------------- SERIAL

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read(); // store new byte
    if (inChar == '\n') { // trigger end of commands
      command.isReady = true;
      break; // ready no further lines, do not add \n to command string. no need.
    }
    command.ogString += inChar; // add to command
  }
}

void flash(int pin) {
  digitalWrite(pin, !digitalRead(pin));
}

void commandDispatch() {
  
  if(debug){
    Serial.print("Line Received: ");
    Serial.print(command.ogString);
  }
 
  ripCommands(); // rips through string, builds command object

  for(int i = 0; i < 5; i ++){
    if(command.pairs[i].isReady){
      pairSetup(i);
    }
  }
  executeBlock();
  wipeCommand();
}

void ripCommands() {
  int charNum = 0;
  int pnum = 0; // this loop will roll through and add tuples
  int runLength = command.ogString.length() + 1;
  
  while (charNum < runLength) { // LOOPING THROUGH THE COMMAND
    if(isAlpha(command.ogString.charAt(charNum))){ // WHEN WE FIND A COMMAND CODE
      command.pairs[pnum].code = command.ogString.charAt(charNum); // store code in 1st pair
      charNum ++; // to next char
      // DO Number-find proceeding Command Code \/
      while (isDigit(command.ogString.charAt(charNum)) || command.ogString.charAt(charNum) == '-' || command.ogString.charAt(charNum) == '.') { 
        command.pairs[pnum].valString += command.ogString.charAt(charNum);
        if (charNum < runLength){ charNum ++; } else { Serial.println("BRKPNT 1"); break; } // go to next char, or bail if none left
      } // done reading digits to char string
      if (command.pairs[pnum].valString.length() > 0){ // if there is a number
        command.pairs[pnum].val = stringToFloat(command.pairs[pnum].valString);
      } else {
        command.pairs[pnum].val = 0.00;
      }
      command.pairs[pnum].isReady = true; // set flags
      command.pairs[pnum].wasExecuted = false;
      pnum ++; // only iterate pair once - per new alpha character
    } else {
      charNum ++;
    }
  }
  command.wasExecuted = false;
  if(false){printCommand();}
}

void printCommand(){
  Serial.println(" ");
  Serial.println("PRINT COMMAND:");
  Serial.print("OG STRING: ");
  Serial.println(command.ogString);
  Serial.println(" ");
  for(int i = 0; i < 5; i++){
    Serial.print("prntcmd: PAIR: ");
    Serial.println(i);
    Serial.print("prntcmd: code: ");
    Serial.println(command.pairs[i].code);
    Serial.print("prntcmd: valString: ");
    Serial.println(command.pairs[i].valString);
    Serial.print("prntcmd: val: ");
    Serial.println(command.pairs[i].val);
    Serial.print("prntcmd: wasExectuted: ");
    Serial.println(command.pairs[i].wasExecuted);
    Serial.println(" ");
  }
}

float stringToFloat(String fltString){
  int length = fltString.length() + 1;
  char buffer[length];
  fltString.toCharArray(buffer, length);
  return atof(buffer);
}

void pairSetup(int i){
  
  char code = command.pairs[i].code;
  float val = command.pairs[i].val;
  
  switch (code) {
    
    case 'X':
      command.replyString += "X Test";
      break;

    case 'A': // move A motor to pos
      goToDegA(val, false); // go to this pos, don't wait yet
      command.hasToMove = true;
      command.replyString += "A";
      command.replyString += String(val);
      //command.pairs[i].replyString += "CA";
      //command.pairs[i].replyString += String(val);
      break;

    case 'B': //
      goToDegB(val, false);
      command.hasToMove = true;
      command.replyString += "B";
      command.replyString += String(val);
      //command.pairs[i].replyString += "CB";
      //command.pairs[i].replyString += String(val);
      break;
      
    case 'M':
      command.isMeasurement = true;
      break;

    case 'S':
      command.isScanSequence = true;
      break;

    case 'H':
      homeSteppers();
      command.replyString += "H Homed";
      break;

    case 'C':
      disableSteppers();
      command.replyString += "C Disabled Steppers";
      break;

    case 'E':
      enableSteppers();
      command.replyString += "E Enabled Steppers";
      break;

    case 'L':
      flash(lzr);
      command.replyString += "L Laser Toggle";
      break;

    case 'R':
      delay(100);
      command.replyString += "R Mylexis: ";
      command.replyString += String(mlx.readObjectTempC());
      break;

    case 'T':
      command.replyString += "T Ambient: ";
      command.replyString += String(mlx.readAmbientTempC());
      break;

    case 'D':
      command.replyString += "D Distance: ";
      command.replyString += String(measureDistance());
      break;

    default :
      command.replyString += "Unknown Code in Command: ";
      command.replyString += command.ogString;
  } // end case
      
}

void executeBlock(){

  if(command.hasToMove){ // do moves first
    while (stepperA.distanceToGo() != 0 || stepperB.distanceToGo() != 0) {
      stepperA.run();
      stepperB.run();
    }
    command.hasToMove = false;
  }

  if(command.isScanSequence || command.isMeasurement){
    command.replyString = ""; // clear other replies: we only want to send measurement notification
  }

  if(command.isScanSequence){ // S char triggers next scan request
    command.replyString += "S";
  }

  if(command.isMeasurement){ // setup measurement reply
    delay(100); // for mylexis
    command.replyString += "M";
    command.replyString += "A";
    command.replyString += String(stepperA.currentPosition()/stepsPerDegA); 
    command.replyString += "B";
    command.replyString += String(stepperB.currentPosition()/stepsPerDegB);
    command.replyString += "D";
    command.replyString += String(10.0);//command.replyString += String(measureDistance());
    command.replyString += "R";
    command.replyString += String(mlx.readObjectTempC());
  }

  Serial.println(command.replyString);

  command.wasExecuted = true;
  
}

void wipeCommand(){
    
  command.ogString = "";
  command.isReady = false;
  command.wasExecuted = false;
  command.hasToMove = false;
  command.isMeasurement = false;
  command.isScanSequence = false;
  command.replyString = "";

  for(int i = 0; i < 5; i ++){
    command.pairs[i].code = '-';
    command.pairs[i].valString = "";
    command.pairs[i].val = 0;
    command.pairs[i].wasExecuted = true;
    command.pairs[i].isReady = false;
  }
}

// ----------------- STEPPERS

void initSteppers() {
  pinMode(stepEnA, OUTPUT);
  pinMode(stepEnB, OUTPUT);
  stepperA.setMaxSpeed(2000);
  stepperA.setAcceleration(5000);
  stepperB.setMaxSpeed(1500);
  stepperB.setAcceleration(8000);
  enableSteppers();
  pinMode(stepLimitA, INPUT);
  pinMode(stepLimitB, INPUT);
}

void enableSteppers() {
  digitalWrite(stepEnB, LOW);
  digitalWrite(stepEnA, LOW);
  stepEnabled = true;
  Serial.println("Steppers Enabled");
}

void disableSteppers() {
  digitalWrite(stepEnB, HIGH);
  digitalWrite(stepEnA, HIGH);
  stepEnabled = false;
  Serial.println("Steppers Disabled");
}

void homeSteppers() {
  stepperA.setCurrentPosition(0);
  stepperB.setSpeed(-stepHomeSpeed);
  while (digitalRead(stepLimitB) == 1) {
    stepperB.runSpeed();
  }
  stepperB.setCurrentPosition(degWhenHomedB * stepsPerDegB);
  goToDegB(0, true);
  Serial.println("Homed");
  // while notswitched, move at speed, then set to 0 pos, move to pos_after_home, set to 0pos

}

void goToDegA(float deg, bool wait) {
  if (deg > 95 || deg < -95) {
    Serial.print("OOB on A: ");
    Serial.println(deg);
  }
  int steps = round(deg * stepsPerDegA);
  stepperA.moveTo(steps);
  if(wait){
    while (stepperA.distanceToGo() != 0) {
      stepperA.run();
    }
  }
}

void goToDegB(float deg, bool wait) {
  if (deg > 120 || deg < -120) {
    Serial.print("OOB on B: ");
    Serial.println(deg);
  }
  int steps = round(deg * stepsPerDegB);
  stepperB.moveTo(steps);
  if(wait){
    while (stepperB.distanceToGo() != 0) {
      stepperB.run();
    }
  }
}

// ----------------- LIDAR

void initLidar() {
  pinMode(lidarMode, OUTPUT);
  digitalWrite(lidarMode, LOW);
  pinMode(lidarMonitor, INPUT);
}

float measureDistance() {
  float distance = 0;
  pulseWidth = pulseIn(15, HIGH);
  if (pulseWidth != 0) {
    distance = float(pulseWidth) / 1000;
  }
  return distance;
}

// ----------------- MLX

void initMLX() {
  mlx.begin();
}

// ---------------- SWITCHES

void initSwitches() {
  pinMode(statusLed, OUTPUT);
  pinMode(lzr, OUTPUT);
  digitalWrite(lzr, LOW);
}



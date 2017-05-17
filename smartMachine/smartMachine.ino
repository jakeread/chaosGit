#include <AccelStepper.h>
#include <Adafruit_MLX90614.h>
#include <Metro.h>
#include "cmdStruct.h"

// --------------------------------------------------------- @ Section GLOBALS

// -------------- @ Subsection Misc Globals

Metro hanger = Metro(25); // this is a check-based timer, used to flash status LED

#define debug false   // set 'true' for verbose serial responses

#define statusLed 13  // Teensy LED Pin

#define lzr 14        // Switch for Laser Pointer

// -------------- @ Subsection Serial Globals

CMD command;          // the CMD Struct
String buffString;    // the String we buffer chars into until '\n'

// -------------- @ Subsection Stepper Globals

AccelStepper stepperA(AccelStepper::DRIVER, 6, 5);
AccelStepper stepperB(AccelStepper::DRIVER, 11, 10);

#define stepEnA 9
#define stepEnB 12
#define stepLimitA 7
#define stepLimitB 8

#define stepsPerDegA 46.8
#define stepsPerDegB 34.37 // (16/numTeeth * 200*microStep) / 360

#define degWhenHomedA -10
#define degWhenHomedB -45
#define stepHomeSpeed 1000

#define STEP_A_MAXSPEED 4000
#define STEP_A_MAXACCEL 12000
#define STEP_B_MAXSPEED 3000
#define STEP_B_MAXACCEL 9000

boolean stepEnabled = false;

// -------------- @ Subsection Sensor Globals

Adafruit_MLX90614 mlx = Adafruit_MLX90614();

unsigned long pulseWidth;
#define lidarMode 16
#define lidarMonitor 15L

// --------------------------------------------------------- @ Section SETUP LOOP

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

  /*
   * the loop just checks if a serial command is ready to be executed
   * serial commands are received using the serialEvent() handler below
   * otherwise it flashes the status led
   */

void loop() {
  if (command.isReady) {
    commandDispatch();
  }
  if (hanger.check() == 1) {
    flash(statusLed);
  }
}

// --------------------------------------------------------- @ Section SERIAL

/*
 * the Arduino system calls this function whenever a new byte
 * is available on the serial port
 *
 * NOTE: if no newline character is received - i.e. if you have line-endings
 * set up incorrectly in a terminal, command.isReady will never be true,
 * and nothing will happen!
 */

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();  // store new byte (chars are also 8-bit)
    if (inChar == '\n') {               // if char is 'newline'
      command.isReady = true;           // set ready-to-read command
      break;
    }
    command.ogString += inChar;         // otherwise, add char to the command string
  }
}

  /*
   * Called from the loop once command.isReady is true
   * (1) first, uses ripCommands() to turn strings into CMDPairs (pairs of command codes (chars) and values (floats) see cmdStruct.h)
   * (2) then, per CMDPair, uses pairSetup(); to do necessary prep-work for comman execution
   * (3) once setup, runs executeBlock() to: wait for steppers, read sensors, write reply string etc
   * (4) finally: wipeCommand() clears the CMD struct out so that it can be re-used next time a command comes through the pipe
   *
   * ** IMPORTANT Note: because we are not buffering commands, if new chars come down the serial while
   * this is executing (say, waiting for steppers to finish moving), they will be added to the command.ogString and will get lost!
   */

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

  /*
   * walks through String and breaks down into Chars & Numbers
   */

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

  /*
   * utility for printing the parsed command back onto the serial
   * useful for debugging the function above
   */

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
    command.replyString += String(measureDistance());
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

// --------------------------------------------------------- @ Section STEPPERS

void initSteppers() {
  pinMode(stepEnA, OUTPUT);
  stepperA.setPinsInverted(true, false, false);
  pinMode(stepEnB, OUTPUT);
  stepperA.setMaxSpeed(STEP_B_MAXSPEED);
  stepperA.setAcceleration(STEP_A_MAXACCEL);
  stepperB.setMaxSpeed(STEP_B_MAXSPEED);
  stepperB.setAcceleration(STEP_B_MAXACCEL);
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

// -------------- @ Subsection STEPPER GOTO

  /*
   * the AccelStepper library does not implement an interrupt-based
   * step timer. this means the system has to be told to check whether enough
   * time has past (since the last step) that it should make another step.
   * this is what the .run() function does.
   *
   * the following two functions implement this method: they set a new
   * target position to .moveTo(steps), and hold in a while-loop, performing the
   * step-check until the position is reached
   */

void goToDegA(float deg, bool wait) {
  if (deg > 720 || deg < -720) {
    Serial.print("OOB on A: ");
    Serial.println(deg);
  }
  int steps = round(deg * stepsPerDegA);
  stepperA.setSpeed(STEP_A_MAXSPEED);
  stepperA.moveTo(steps);
  if(wait){
    while (stepperA.distanceToGo() != 0) {
      stepperA.run();
    }
  }
}

void goToDegB(float deg, bool wait) {
  if (deg > 360 || deg < -360) {
    Serial.print("OOB on B: ");
    Serial.println(deg);
  }
  int steps = round(deg * stepsPerDegB);
  stepperB.setSpeed(STEP_B_MAXSPEED);
  stepperB.moveTo(steps);
  if(wait){
    while (stepperB.distanceToGo() != 0) {
      stepperB.run();
    }
  }
}

  /*
   * HOMING is a mess, and does not work to a satisfactory level
   * TODO:  -> make sure degWhenHomedA,B is correct (this is the offset between switch-on degrees and '0' degrees
   *        -> carefully plan homing logic, considering
   *          - what happens when homing routine starts and the switch is already on? should back-off and re-approach
   *          - what happens when homing winds >180 degrees from starting position, indicating it is likely one full rotation from 'true' home
   *          - what happens on switch error, when homing winds >360 deg and no position is found?
   *          - etc...
   */

void homeSteppers() {
  // home A
  stepperA.setCurrentPosition(0);
  if(digitalRead(stepLimitA) == 0){ // if already home, back off so we hit switch at same spot
    goToDegA(-20, true);
  }

  stepperA.setSpeed(stepHomeSpeed);
  while(digitalRead(stepLimitA) == 1) {
    stepperA.runSpeed(); // should have timeout for if this doesn't switch
  }
  // on exit, if we have travelled more than ~200 degrees, we have swung the wrong way,
  // do setCurrent Position +/- 360* so that we unwind on the next move
  if(stepperA.currentPosition() / stepsPerDegA > 200){
    stepperA.setCurrentPosition(degWhenHomedA * stepsPerDegA + 360 * stepsPerDegA);
  } else {
    stepperA.setCurrentPosition(degWhenHomedA * stepsPerDegA);
  }
  goToDegA(0, true);


  // home B
  stepperB.setCurrentPosition(0);
  if(digitalRead(stepLimitB) == 0) {
    goToDegB(-20, true);
  }

  stepperB.setSpeed(stepHomeSpeed);
  while (digitalRead(stepLimitB) == 1) {
    stepperB.runSpeed();
  }
  if(stepperB.currentPosition() / stepsPerDegB > 200){
    stepperB.setCurrentPosition(degWhenHomedB * stepsPerDegB + 360 * stepsPerDegB);
  } else {
    stepperB.setCurrentPosition(degWhenHomedB * stepsPerDegB);
  }
  goToDegB(-20.65, true);
  stepperB.setCurrentPosition(0);
}

// --------------------------------------------------------- @ Section SENSORS

// -------------- @ Subsection LIDAR

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

// -------------- @ Subsection MLX

void initMLX() {
  mlx.begin();
}

// -------------- @ Subsection SWITCHES

void initSwitches() {
  pinMode(statusLed, OUTPUT);
  pinMode(lzr, OUTPUT);
  digitalWrite(lzr, LOW);
}

void flash(int pin) {
  digitalWrite(pin, !digitalRead(pin));
}



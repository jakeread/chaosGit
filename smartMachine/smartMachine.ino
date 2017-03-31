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
Metro hanger = Metro(100);

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
    commandDispatch();
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

void ripCommands() {
  int charNum = 0;
  int pnum = 0; // this loop will roll through and add tuples
  int runLength = command.ogString.length() + 1;
  while (charNum < runLength) {
    if(isUpperCase(command.ogString.charAt(charNum))){ // if it's a command code
      command.pairs[pnum].code = command.ogString.charAt(charNum); // store code in 1st pair
      charNum ++; // to next char
      while (isDigit(command.ogString.charAt(charNum)) || command.ogString.charAt(charNum) == '-' || command.ogString.charAt(charNum) == '.') { // now write all succeeding digits to valString
        command.pairs[pnum].valString += command.ogString.charAt(charNum);
        if (charNum <= runLength){ // if still chars to read
          charNum ++;
        } else {
          break;
        }
      } // end read digits for latest pair
      if (command.pairs[pnum].valString.length() > 0){ // if there is a number
        command.pairs[pnum].val = stringToFloat(command.pairs[pnum].valString);
      } else {
        command.pairs[pnum].val = 0.0;
      }
      pnum ++;
    } // end if is upper case
    charNum ++;
  }

  printCommand();
}

void printCommand(){
  Serial.println("COMMAND:");
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

void wipeCommand(){
  Serial.println("wiping command");
  
  command.ogString = "";
  command.isReady = false;
  command.wasExecuted = false;

  for(int i = 0; i < 5; i ++){
    command.pairs[i].code = '-';
    command.pairs[i].valString = "";
    command.pairs[i].val = 0;
    command.pairs[i].wasExecuted = false;
  }
}

float stringToFloat(String fltString){
  int length = fltString.length() + 1;
  char buffer[length];
  fltString.toCharArray(buffer, length);
  return atof(buffer);
}

void commandDispatch() {
 
  ripCommands();

  if(debug){
    Serial.print("Line Received: ");
    Serial.print(command.ogString);
  }


  switch ('X') {
    
    case 'X':
      Serial.println("Test Command");
      break;

    case 'A': // move A motor to pos
      goToDegA(0);
      Serial.print("CA");
      Serial.println(0);
      break;

    case 'B': //
      goToDegB(0);
      Serial.print("CB");
      Serial.println(0);
      break;
      
    case 'M':
      Serial.print("M");
      Serial.print("A");
      Serial.print(01);//stepperA.currentPosition()/stepsPerDegA); 
      Serial.print("B");
      Serial.print(02);//stepperB.currentPosition()/stepsPerDegB);
      Serial.print("D");
      Serial.print(03);//Serial.print(measureDistance());
      Serial.print("R");
      Serial.println(04);//Serial.println(mlx.readObjectTempC());
      break;

    case 'H':
      homeSteppers();
      Serial.println("Homed");
      break;

    case 'C':
      disableSteppers();
      Serial.println("Steppers Disabled");
      break;

    case 'E':
      enableSteppers();
      Serial.println("Steppers Enabled");
      break;

    case 'L':
      flash(lzr);
      Serial.println("Laserbeams On");
      break;

    case 'R':
      delay(100);
      Serial.print("Mylexis: ");
      Serial.println(mlx.readObjectTempC());
      break;

    case 'T':
      Serial.print("Ambient: ");
      Serial.println(mlx.readAmbientTempC());
      break;

    case 'D':
      Serial.print("Distance: ");
      Serial.println(measureDistance());
      break;

    default :
      Serial.print("Not A Code: ");
      Serial.println(command.ogString);
      
  }

  wipeCommand();

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
  goToDegB(0);
  Serial.println("Homed Steppers");
  // while notswitched, move at speed, then set to 0 pos, move to pos_after_home, set to 0pos

}

void goToDegA(float deg) {
  if (deg > 95 || deg < -95) {
    Serial.print("yer outta bounds there bud: on A: ");
    Serial.println(deg);
  }
  int steps = round(deg * stepsPerDegA);
  stepperA.moveTo(steps);
  while (stepperA.distanceToGo() != 0) {
    stepperA.run();
  }
}

void goToDegB(float deg) {
  if (deg > 120 || deg < -120) {
    Serial.print("yer outta bounds there bud: on B: ");
    Serial.println(deg);
  }
  int steps = round(deg * stepsPerDegB);
  stepperB.moveTo(steps);
  while (stepperB.distanceToGo() != 0) {
    stepperB.run();
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



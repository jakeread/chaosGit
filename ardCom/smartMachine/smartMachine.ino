#include <AccelStepper.h>
#include <Adafruit_MLX90614.h>
#include <Metro.h>

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
String command = "";
boolean commandComplete = false;
char commandCode = ' ';
float commandVal = 0;

// timer, to c if u hang 10
Metro hanger = Metro(100);

void setup() {
  Serial.begin(38400);
  if(debug){
    Serial.println("teensy: Serial hath begun.");
  }

  command.reserve(512); // reserve bytes for the string

  initSteppers();
  initLidar();
  initSwitches();
  initMLX();
}

void loop() {
  if (commandComplete) {
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
    command += inChar; // add to command
    if (inChar == '\n') { // trigger end of commands
      commandComplete = true;
    }
  }
}

void flash(int pin) {
  digitalWrite(pin, !digitalRead(pin));
}

void parseCommand() {
  char thisChar;
  for (uint8_t i = 0; i < command.length() + 1; i++) {
    thisChar = command.charAt(i);
    if (isUpperCase(thisChar)) {
      commandCode = thisChar;
    }
  }
}

void parseVal() {
  String valString = "";
  char thisChar;
  for (uint8_t i = 0; i < command.length() + 1; i++) {
    thisChar = command.charAt(i);
    if (isDigit(thisChar) || thisChar == '-' || thisChar == '.') { // if is digit, -ve, decimal
      valString += (char)thisChar;
    }
  } // finish looping through chars,

  int length = valString.length() + 1;
  char buffer[length];
  valString.toCharArray(buffer, length);
  commandVal = atof(buffer);
}

void commandDispatch() {
 
  parseCommand();
  parseVal();

  if(debug){
    Serial.print("Line Received: ");
    Serial.println(command);
    Serial.print("commandCode: ");
    Serial.println(commandCode);
    Serial.print("commandVal: ");
    Serial.println(commandVal);
  }


  switch (commandCode) {
    case 'X':
      Serial.println("Test Command");
      break;

    case 'A': // move A motor to pos
      goToDegA(commandVal);
      Serial.print("A");
      Serial.println(commandVal);
      break;

    case 'B': //
      goToDegB(commandVal);
      Serial.print("B");
      Serial.println(commandVal);
      break;
      
    case 'M':
      Serial.print("M");
      Serial.print("A");
      Serial.print(stepperA.currentPosition()/stepsPerDegA); 
      Serial.print("B");
      Serial.print(stepperB.currentPosition()/stepsPerDegB);
      Serial.print("D");
      Serial.print(measureDistance());
      Serial.print("R");
      Serial.println(mlx.readObjectTempC());
      break;

    case 'H':
      homeSteppers();
      Serial.println("H");
      break;

    case 'C':
      disableSteppers();
      Serial.println("C");
      break;

    case 'E':
      enableSteppers();
      Serial.println("E");
      break;

    case 'L':
      flash(lzr);
      Serial.println("L");
      break;

    case 'R':
      delay(100);
      Serial.print("R");
      Serial.println(mlx.readObjectTempC());
      break;

    case 'T':
      Serial.print("T");
      Serial.println(mlx.readAmbientTempC());
      break;

    case 'D':
      Serial.print("D");
      Serial.print(measureDistance());
      break;

    default:
      Serial.println("NOCODE");
  }

  command = "";
  commandCode = ' ';
  commandVal = 0;
  commandComplete = false;

}

// ----------------- STEPPERS

void initSteppers() {
  pinMode(stepEnA, OUTPUT);
  pinMode(stepEnB, OUTPUT);
  stepperA.setMaxSpeed(4000);
  stepperA.setAcceleration(10000);
  stepperB.setMaxSpeed(7000);
  stepperB.setAcceleration(20000);
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



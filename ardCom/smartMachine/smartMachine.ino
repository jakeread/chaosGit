#include <AccelStepper.h>
#include <Adafruit_MLX90614.h>
#include <Metro.h>

//steppers
AccelStepper stepperA(AccelStepper::DRIVER, 6, 5);
AccelStepper stepperB(AccelStepper::DRIVER, 11, 10);
#define stepEnA 9
#define stepEnB 12
boolean stepEnabled = false;

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
  Serial.println("teensy: Serial hath begun.");

  command.reserve(512); // reserve bytes for the string
  
  initSteppers();
  initLidar();
  initSwitches();
  initMLX();
}

void loop() {
  commandDispatch();
  stepperA.run();
  stepperB.run();
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
  for (uint8_t i = 0; i < command.length(); i++) {
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

  if (commandComplete) { // do on command complete
    Serial.print("Line Received: ");
    Serial.println(command);

    parseCommand();
    parseVal();

    Serial.print("commandCode: ");
    Serial.println(commandCode);
    Serial.print("commandVal: ");
    Serial.println(commandVal);


    switch (commandCode) {
      case 'X':
        Serial.println("Test Command");
        break;

      case 'A': // move A motor to pos
        stepperA.moveTo(commandVal); // write function that does steps -> angles etc
        break;

      case 'B': //
        stepperB.moveTo(commandVal);
        break;

      case 'L':
        flash(lzr);
        break;

      case 'R':
        Serial.print("R"); // and a delay, and pos. verification
        Serial.println(mlx.readObjectTempC());
        break;

      case 'T':
        Serial.print("T");
        Serial.println(mlx.readAmbientTempC());
        break;

      case 'D':
        Serial.print("D");
        if (pulseWidth != 0) {
          pulseWidth = pulseWidth / 10;
          Serial.println(pulseWidth);
        } else {
          Serial.println("X");
        }
        break;

      default:
        Serial.println("0");
    }

    command = "";
    commandCode = ' ';
    commandVal = 0;
    commandComplete = false;
  }
}

// ----------------- STEPPERS

void initSteppers() {
  pinMode(stepEnA, OUTPUT);
  pinMode(stepEnB, OUTPUT);
  stepperA.setMaxSpeed(4000);
  stepperA.setAcceleration(10000);
  stepperB.setMaxSpeed(7000);
  stepperB.setAcceleration(20000);
}

void enableSteppers() {
  digitalWrite(stepEnB, LOW);
  digitalWrite(stepEnA, LOW);
  stepEnabled = true;
}

void disableSteppers() {
  digitalWrite(stepEnB, HIGH);
  digitalWrite(stepEnA, HIGH);
  stepEnabled = false;
}

// ----------------- LIDAR

void initLidar() {
  pinMode(lidarMode, OUTPUT);
  digitalWrite(lidarMode, LOW);
  pinMode(lidarMonitor, INPUT);
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



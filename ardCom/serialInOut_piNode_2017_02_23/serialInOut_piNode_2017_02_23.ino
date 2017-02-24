#include <AccelStepper.h>
#include <Adafruit_MLX90614.h>

//movement
AccelStepper stepperA(AccelStepper::DRIVER, 6,5);
AccelStepper stepperB(AccelStepper::DRIVER, 11,10);
#define stepEnA 9
#define stepEnB 12

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

void setup(){
  Serial.begin(38400);
  Serial.println("teensy: Serial hath begun.");
  
  command.reserve(512); // reserve bytes for the string
  
  pinMode(stepEnA, OUTPUT);
  pinMode(stepEnB, OUTPUT);

  pinMode(statusLed, OUTPUT);
  pinMode(lzr, OUTPUT);
  digitalWrite(lzr, LOW);

  digitalWrite(stepEnB, LOW);
  digitalWrite(stepEnA, LOW);
  stepperA.setMaxSpeed(4000);
  stepperA.setAcceleration(10000);
  stepperB.setMaxSpeed(7000);
  stepperB.setAcceleration(20000);

  mlx.begin();

  pinMode(lidarMode, OUTPUT);
  digitalWrite(lidarMode, LOW);
  pinMode(lidarMonitor, INPUT);
}

void loop() {
  flash(statusLed);
  
  if(commandComplete){ // do on command complete
    Serial.print("duino confirms: ");
    Serial.println(command);
    
    parseCommand();
    parseVal();
    
    Serial.println("parsed command: ");
    Serial.print("commandCode: ");
    Serial.println(commandCode);
    Serial.print("commandVal: ");
    Serial.println(commandVal);

    
      
    if(commandCode == 'T') { // do case
      Serial.println("Test Command");
    } else if (commandCode == 'A'){
      stepperA.moveTo(commandVal);
      Serial.print("stepper A to: ");
      Serial.println(commandVal);
    } else if (commandCode == 'B'){
      stepperB.moveTo(commandVal);
      Serial.print("stepper B to: ");
      Serial.println(commandVal);
    } else if(commandCode == 'L'){
      flash(lzr);
      Serial.println("toggled LAZER BEAM");
    } else if(commandCode == 'R'){
      Serial.println("MLX Reading Now; ");
      Serial.print("Ambient = "); Serial.println(mlx.readAmbientTempC());
      Serial.print("Object = "); Serial.println(mlx.readObjectTempC());
    } else if(commandCode = 'D'){
      Serial.print("Doing Distance: ");
      pulseWidth = pulseIn(lidarMonitor, HIGH);
      if(pulseWidth != 0){
        pulseWidth = pulseWidth/10;
        Serial.println(pulseWidth);
      } else {
        Serial.println("no dice on LIDAR");
      }
    }
    
    command = "";
    commandCode = ' ';
    commandVal = 0;
    commandComplete = false;
  }

  stepperA.run();
  stepperB.run();
}

void serialEvent(){
  while(Serial.available()){
    char inChar = (char)Serial.read(); // store new byte
    command += inChar; // add to command
    if (inChar == '\n') { // trigger end of commands
      commandComplete = true;
    }
  }
}

void flash(int pin){
  digitalWrite(pin, !digitalRead(pin));
}

void parseCommand() {
  char thisChar;
  for(int i=0; i<command.length(); i++){
    thisChar = command.charAt(i);
    if(isUpperCase(thisChar)){
      commandCode = thisChar;
    }
  }
}

void parseVal() {
  String valString = "";
  char thisChar;
  for(int i=0; i<command.length()+1; i++){
    thisChar = command.charAt(i);
    if(isDigit(thisChar) || thisChar == '-' || thisChar == '.') { // if is digit, -ve, decimal
      valString += (char)thisChar;
    }
  } // finish looping through chars,
  
  int length = valString.length()+1;
  char buffer[length];
  valString.toCharArray(buffer, length);
  commandVal = atof(buffer);
}

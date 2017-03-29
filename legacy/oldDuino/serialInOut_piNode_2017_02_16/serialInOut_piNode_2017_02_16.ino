int potPin = A1;
int potRead = 0;
int ledPin = 10;
int statusLed = 11;

// command business
String command = "";
boolean commandComplete = false;
char commandCode = ' ';
float commandVal = 0;

void setup(){
  Serial.begin(9600);
  Serial.println("duino: Serial hath begun.");
  
  command.reserve(512); // reserve bytes for the string
  
  pinMode(ledPin, OUTPUT);
  pinMode(statusLed, OUTPUT);
  digitalWrite(ledPin, HIGH);
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

    
      
    if(commandCode == 'L') {
      flash(ledPin);
      Serial.println("LED flash");
    } else if (commandCode == 'P'){
      analogWrite(ledPin, commandVal);
      Serial.print("LED PWM: ");
      Serial.println(commandVal);
    }
    
    command = "";
    commandCode = ' ';
    commandVal = 0;
    commandComplete = false;
  }
  
  delay(50);
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
  
  int length = valString.length();
  char buffer[length];
  valString.toCharArray(buffer, length);
  commandVal = atof(buffer);
}

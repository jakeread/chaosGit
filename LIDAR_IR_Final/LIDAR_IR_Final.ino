#include <Servo.h>
#include <I2C.h>
#define    LIDARLite_ADDRESS   0x62          // Default I2C Address of LIDAR-Lite.
#define    RegisterMeasure     0x00          // Register to write to initiate ranging.
#define    MeasureValue        0x04          // Value to initiate ranging.
#define    RegisterHighLowB    0x8f          // Register to get both High and Low bytes in 1 call.

Servo halfservo;  // create servo object to control a servo
Servo continservo;
#define servo_pin 2
int MotorControl = 7;
int pos = 0;    // variable to store the servo position
int FOV = 5;

#include <Wire.h>
#include <Adafruit_MLX90614.h>

Adafruit_MLX90614 mlx = Adafruit_MLX90614();

void setup(){
 pinMode(MotorControl, OUTPUT);
  Serial.begin(9600); //Opens serial connection at 9600bps.     
  I2c.begin(); // Opens & joins the irc bus as master
  delay(100); // Waits to make sure everything is powered up before sending or receiving data  
  I2c.timeOut(50); // Sets a timeout to ensure no locking up of sketch if I2C communication fails
  halfservo.attach(0);  // attaches the servo on the A0 pin to the servo object
  continservo.attach(1);
  continservo.write(0);
  pinMode(servo_pin, OUTPUT);
  digitalWrite(servo_pin, LOW);
  mlx.begin();
  halfservo.write(0);
  Serial.println("Go!");
  delay(2000);
}

void loop(){
  Serial.println("Go!");
  for(int k = 0; k<10000; k=k+FOV){

  digitalWrite(MotorControl,HIGH);// NO3 and COM3 Connected (the motor is running)
  delay(33); // wait 1000 milliseconds (1 second)
  digitalWrite(MotorControl,LOW);// NO3 and COM3 Disconnected (the motor is not running) 
       delay(100);
       halfservo.write(0);
       delay(500);
       for(int i = 0; i<181; i=i+5){
         String dataString;
         halfservo.write(i);
         delay(20);
  // Write 0x04 to register 0x00
  uint8_t nackack = 100; // Setup variable to hold ACK/NACK resopnses     
  while (nackack != 0){ // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.write(LIDARLite_ADDRESS,RegisterMeasure, MeasureValue); // Write 0x04 to 0x00
    delay(100); // Wait 1 ms to prevent overpolling
  }

  byte distanceArray[2]; // array to store distance bytes from read function
  
  // Read 2byte distance from register 0x8f
  nackack = 100; // Setup variable to hold ACK/NACK resopnses     
  while (nackack != 0){ // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.read(LIDARLite_ADDRESS,RegisterHighLowB, 2, distanceArray); // Read 2 Bytes from LIDAR-Lite Address and store in array
    delay(100); // Wait 1 ms to prevent overpolling
  }
  int distance = (distanceArray[0] << 8) + distanceArray[1];  // Shift high byte [0] 8 to the left and add low byte [1] to create 16-bit int
  

dataString += String(distance);
dataString += ",";
dataString += String(k);
dataString += ",";
dataString += String(i);
dataString += ",";
dataString += String(mlx.readObjectTempC());
Serial.println(dataString);


       }
   }
   delay(1000);
}

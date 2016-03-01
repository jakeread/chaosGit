/* This Code is used with an Arduino Mega to communicate with Dynamixel
with Dynamixel AX-12A Servo Motor. All commands use Serial 3 to write
to servo and Serial to write to pc for purpose of recieving status packets
*/

// instruction table for Dynamixel AX-12A
//---------------------------------------
#define ping_ins 1 // checked
#define read_ins 2 // checked
#define write_ins 3 // Checked
#define reg_write_ins 4 // Checked
#define action_ins 5 // Checked
#define reset_ins 6 // Checked
#define sync_write_ins 131

//---------------------------------------

//registers table for Dynamixel AX-12A
//---------------------------------------
#define servo_id 3
#define baud_rate 4
#define max_torque 14
#define alarm_led 17
#define alarm_shutdown 18
#define torque_enable 24
#define goal_position 30
#define moving_speed 32
//---------------------------------------

// Code Begins...

#include <Servo.h>
#include <I2C.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <math.h>


#define    LIDARLite_ADDRESS   0x62          // Default I2C Address of LIDAR-Lite.
#define    RegisterMeasure     0x00          // Register to write to initiate ranging.
#define    MeasureValue        0x03          // Value to initiate ranging.
#define    RegisterHighLowB    0x8f          // Register to get both High and Low bytes in 1 call.

// objects

Servo theServo;
Adafruit_MLX90614 theMlx = Adafruit_MLX90614();

// vars

int length, location, temp, checksum, N, L; // used for status packet & return packet

int angleDynamixel = 0;
int angleServo = 0;

int ackNackTrack;
int nackTotalTrack = 0;

void setup()
{
  theServo.attach(10);
  
  Serial3.begin(1000000); // Dynamixel Communication Speed
  Serial.begin(9600); // Communication speed Arduino/PC
  transmit(); // setup dynamixel strangeness to send;
  theMlx.begin();
  
  goDynamixel(0);
  theServo.writeMicroseconds(mapAngleServo(0));

  I2c.begin();
  delay(100);
  I2c.timeOut(50); // init I2c bailout settings (not relevant to mlx)

  ////Serial.println("READYSET!");
  delay(1000); // wait for servos to settle
}
//------------------------------------

int fov = 5; // FOV
int sweepTrack = 0;

void loop()
{
  // loop iterating
  sweepTrack ++;
  bool theSweep = true; // 1 or 0, mlx or distance
  
  for (int y = 30; y < 330; y += fov)
  {
    goDynamixel(y-30); // go to 'y' angle: dynamixel
    
    float add = 0;
    float x = 0;
    while(x < 100){ // while x (rotation) is less than 100
      if (add > 3) {
        delay(300); // have to wait for servo to hit
      }
      goServo(x);
      add = abs(tan(radians(fov/2))/(M_PI*sin(radians(y))))*360;
      x = x+add;
      Serial.print("add \t");
      Serial.print(add);
      Serial.print(" \t x:");
      Serial.print(x);
      Serial.print(" \t y:"); 
      Serial.println(y);
    }
    Serial.println("finished 300 loop");
  }
  
  /*
  if(theSweep)
  {
    theSweep = false;
  }
  else if(!theSweep) // I am sure there is a better way theSweep != theSweep ?!
  {
    theSweep = true;
  }
*/
}

void dataPollPush(int i, int j, bool sweepBool)
{
  if (sweepBool) // should be on 1st swing
  {
    dataMLX(i, j);
  }
  else // and 2nd swing
  {
    dataDistance(i, j);
  }
}

void dataDistance(int k, int i)
{
  nackTotalTrack ++;
  String dataString;

  // Write 0x04 to register 0x00

  uint8_t nackack = 100; // Setup variable to hold ACK/NACK resopnses
  ackNackTrack = 0;

  while (nackack != 0) { // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.write(LIDARLite_ADDRESS, RegisterMeasure, MeasureValue); // Write 0x04 to 0x00
    delay(40); // Wait 1 ms to prevent overpolling

    ackNackTrack ++;
    if (ackNackTrack > 40)
    {
      Serial.println("ackNackTrack over! \t");
      //Serial.println(ackNackTrack);
    }
  }

  //Serial.print("dataNack01\t");
  //Serial.println(nackTotalTrack);

  byte distanceArray[2]; // array to store distance bytes from read function

  // Read 2byte distance from register 0x8f

  ackNackTrack = 0;
  nackack = 100; // Setup variable to hold ACK/NACK resopnses
  while (nackack != 0)
  { // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.read(LIDARLite_ADDRESS, RegisterHighLowB, 2, distanceArray); // Read 2 Bytes from LIDAR-Lite Address and store in array
    delay(40); // Wait 1 ms to prevent overpolling

    ackNackTrack ++;
    if (ackNackTrack > 40)
    {
      Serial.println("ackNackTrack over! \t");
      //Serial.println(ackNackTrack);
    }
  }

  //Serial.print("dataNack02\t");
  //Serial.println(nackTotalTrack);

  int distance = (distanceArray[0] << 8) + distanceArray[1];  // Shift high byte [0] 8 to the left and add low byte [1] to create 16-bit int

  dataString += String(k);
  dataString += ",";
  dataString += String(i);
  dataString += ",";
  dataString += String(distance);
  dataString += ",";
  dataString += "temp";
  delay(10);

  Serial.println(dataString);
}

void dataMLX(int k, int i)
{
  String dataString;
  
  dataString += String(k);
  dataString += ",";
  dataString += String(i);
  dataString += ",";
  dataString += "dist";
  dataString += ",";
  dataString += String(theMlx.readObjectTempC()); // this is where you hang

  
  Serial.println(dataString);
  //Serial.println(theMlx.readObjectTempC());
  delay(150);
}

/// SERVO FUNCTIONS

int mapAngleServo(float angle)
{
  return round(map(angle, 0, 100, 800, 2200)); // mapping between max angles, 0->100, to max pwm values
}

int mapAngleDynamixel(float angle)
{
  return round(map(angle, 0, 300, 1, 1023)); // watch the round function, not arduino documented but is C std
}

void goDynamixel(float angleDynamixel)
{
  reg_write_2_byte(1, goal_position, mapAngleDynamixel(angleDynamixel)); // put location value into buffer
  Action(0xFE); //execute buffer
}

void goServo(float angleServo)
{
  theServo.writeMicroseconds(mapAngleServo(angleServo));
}

/// DYNAMIXEL COMMUNICATION

void transmit()
{
  bitSet(UCSR3B, 3); // Sets Tx pin
  bitClear(UCSR3B, 4); // Clear Rx pin
  bitClear(UCSR3B, 7); // Disable Rx Interrupt
}

void recieve()
{
  bitClear(UCSR3B, 3); // Clear Tx pin
  bitSet(UCSR3B, 4); // Set Rx Pin
  bitSet(UCSR3B, 7); // Allows Rx Interrupt
}


//Recieve Interrupt Subroutine

void serialEvent3()
{
  temp = Serial3.read();
  //Serial.print(temp, HEX); // prints incoming return packet bit
}

/*---------------------------------------
Function to reg_write to a 2 byte register
location = what register to write to
val = what value to write to register
---------------------------------------*/
void reg_write_2_byte(int id, int location, int val)
{
  length = 5; // length of 2-byte instruction is 5
  checksum = ~((id + length + reg_write_ins + location + (val & 0xFF) + ((val & 0xFF00) >> 8)) % 256); //Checksum Value
  Serial3.write(0xFF); // Starts instruction packet
  Serial3.write(0xFF);
  Serial3.write(id);
  Serial3.write(length);
  Serial3.write(reg_write_ins);
  Serial3.write(location);
  Serial3.write(val & 0xFF); // Lower Byte
  Serial3.write((val & 0xFF00) >> 8); // Upper Byte
  Serial3.write(checksum);
}
/*---------------------------------------
Action Function to perform Reg_Write Functions
---------------------------------------*/
void Action(int id)
{
  length = 2;
  checksum = ~((id + length + action_ins) % 256);
  Serial3.write(0xFF);
  Serial3.write(0xFF);
  Serial3.write(id); // Broadcast(0xFE) is used when sending action to two Dynamixels
  Serial3.write(length);
  Serial3.write(action_ins);
  Serial3.write(checksum);
}

/* Sweep
 by BARRAGAN <http://barraganstudio.com> 
 This example code is in the public domain.

 modified 8 Nov 2013
 by Scott Fitzgerald
 http://arduino.cc/en/Tutorial/Sweep
*/ 

#include <Servo.h> 
 
Servo smallServo;  // create servo object to control a servo 
Servo bigServo;

int pos = 70;    // variable to store the servo position 
 
void setup() 
{ 
  smallServo.attach(9);  // attaches the servo on pin 9 to the servo object 
  bigServo.attach(10);
} 
 
void loop() 
{ 
  for(pos = 70; pos <= 110; pos += 1) // goes from 0 degrees to 180 degrees 
  {                                  // in steps of 1 degree 
    //smallServo.write(pos);              // tell servo to go to position in variable 'pos' 
    bigServo.write(pos); 
    delay(15);                       // waits 15ms for the servo to reach the position 
  } 
  for(pos = 110; pos>=70; pos-=1)     // goes from 180 degrees to 0 degrees 
  {                                
    //smallServo.write(pos);              // tell servo to go to position in variable 'pos' 
    bigServo.write(pos);
    delay(15);                       // waits 15ms for the servo to reach the position 
  } 
} 


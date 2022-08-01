//Sensor pins
#define testPin 13
#define laserDiodePin 4
#define laserSensorPin 53
#define pHPin A0
#define pHTempPin A2

//motor parameters
#define enPinVert 36
#define dirPinVert 38
#define stepPinVert 40
#define enPinKnob 22
#define dirPinKnob 24
#define stepPinKnob 26

#define PULSE 6400 //microstep of 6400 steps for 1 revolution
#define DMIN 25 //minimum delay time for smooth spinning
#define DMAX 1600 //maximum delay time in between steps
#define CW HIGH
#define CCW LOW

#define UP HIGH
#define DOWN LOW

//knob parameters
#define OPEN LOW
#define CLOSE HIGH

void setup() {
  // put your setup code here, to run once:
  pinMode(testPin, OUTPUT);

  pinMode(laserDiodePin, OUTPUT);
  pinMode(laserSensorPin, INPUT);
  
  pinMode(enPinVert, OUTPUT);
  pinMode(dirPinVert, OUTPUT);
  pinMode(stepPinVert, OUTPUT);

  pinMode(enPinKnob, OUTPUT);
  pinMode(dirPinKnob, OUTPUT);
  pinMode(stepPinKnob, OUTPUT);

  pinMode(pHPin, INPUT);
  //+9V DC minimum to Arduino for stable analog readings
  analogReference(DEFAULT);

  digitalWrite(enPinVert, HIGH);
  digitalWrite(enPinKnob, HIGH);
  Serial.begin(9600);
}

void pulsePin(int pin, int d) {
  digitalWrite(pin, HIGH);
  delay(d);
  digitalWrite(pin, LOW);
  delay(d);
}

//Stepper motor functions
void pulseMotor(int stepPin, int dMicroS) {
  digitalWrite(stepPin, HIGH);
  delayMicroseconds(dMicroS);
  digitalWrite(stepPin, LOW);
  delayMicroseconds(dMicroS);  
}

void spinMotorSteps(int stepPin, int dirPin, int dir, int steps, double spd) {
  digitalWrite(dirPin, dir);
  double dMicroS = DMAX - (DMAX - DMIN) * (spd / 100);

  for (int i = 0; i < int(steps); i++) {
    pulseMotor(stepPin, int(dMicroS));
  }
}

void spinMotorDeg(int stepPin, int dirPin, int dir, double angle, double spd) {
  double steps;
  steps = angle / 360.0 * PULSE;
  
  spinMotorSteps(stepPin, dirPin, dir, int(steps), spd);
}

void loop() {
  // put your main code here, to run repeatedly:
  digitalWrite(laserDiodePin, HIGH);
  delay(50);
  Serial.println(digitalRead(laserSensorPin));
//  delay(200);
//  digitalWrite(laserDiodePin, LOW);
//  delay(50);
//  Serial.println(digitalRead(laserSensorPin));
//  delay(200);
  //spinMotorDeg(stepPinVert, dirPinVert, CW, 60, 75);
  //spinMotorDeg(stepPinVert, dirPinVert, CCW, 60, 50);

  //spinMotorDeg(stepPinKnob, dirPinKnob, CW, 60, 75);
  //spinMotorDeg(stepPinKnob, dirPinKnob, CCW, 60, 50);
}

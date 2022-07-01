#define BAUDRATE 115200

//serial flags
#define FLAG_RETURN 200
#define FLAG_STOP 201

//switch cases
#define UP_UNTIL_STOP 101
#define LOWER_UNTIL_STOP 102
#define DROP_SEQ 103

#define testPin 13
#define laserPin 22

//motor parameters
#define enPinVert 5
#define dirPinVert 6
#define stepPinVert 7
#define enPinKnob 8
#define dirPinKnob 9
#define stepPinKnob 10

#define PULSE 6400 //microstep of 6400 steps for 1 revolution
#define DMIN 25 //minimum delay time for smooth spinning
#define DMAX 1600 //maximum delay time in between steps
#define CW HIGH
#define CCW LOW

//scaffold parameters
#define PITCH 8 //pitch
#define UP HIGH
#define DOWN LOW

//knob parameters
#define OPEN LOW
#define CLOSE HIGH

void setup() {
  pinMode(laserPin, INPUT);

  pinMode(testPin, OUTPUT);
  
  pinMode(enPinVert, OUTPUT);
  pinMode(dirPinVert, OUTPUT);
  pinMode(stepPinVert, OUTPUT);

  pinMode(enPinKnob, OUTPUT);
  pinMode(dirPinKnob, OUTPUT);
  pinMode(stepPinKnob, OUTPUT);
  
  digitalWrite(enPinVert, HIGH);
  digitalWrite(enPinKnob, HIGH);

  Serial.begin(BAUDRATE);
}

String processInput() {
  String data = "";
  delay(20);

  while(Serial.available()) {
    char c = Serial.read();
    data.concat(c);
    Serial.print(c);
  }

  return data;
}

void blinkTestLight(int d) {
  digitalWrite(testPin, HIGH);
  delay(d);
  digitalWrite(testPin, LOW);
  delay(d);
}

void signalReceived() {
  Serial.print(FLAG_RETURN);
}

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

void spinMotorMM(int stepPin, int dirPin, int dir, double heightMM, double spd) {
  digitalWrite(dirPin, dir);
  
  double steps = heightMM / double(PITCH) * PULSE;
  
  spinMotorSteps(stepPin, dirPin, dir, int(steps), spd);
}

int isBlocked() {
  return digitalRead(laserPin);
}

double measureDropMM() {
  digitalWrite(testPin, isBlocked());
  //return;
  
  double d = 0.01;
  double s = 0;
  
  if (isBlocked()) return -1;
  
  while(!isBlocked()) {
    spinMotorMM(stepPinVert, dirPinVert, DOWN, d, 75);
    s++;
  }
  delay(100);
  while(isBlocked()) {
    spinMotorMM(stepPinVert, dirPinVert, UP, d, 20);
    s--;
  }
  delay(100);
  while(!isBlocked()) {
    spinMotorMM(stepPinVert, dirPinVert, DOWN, d, 10);
    s++;
  }
  return s * d;
}

void upSeq() {
  spinMotorMM(stepPinVert, dirPinVert, UP, 1, 100);
}

void knobSeq() {
  int d = 1;
  int steps = 0;
  
  while(!isBlocked()) spinMotorSteps(stepPinKnob, dirPinKnob, CLOSE, d, 30);
  while(isBlocked()) {
    spinMotorSteps(stepPinKnob, dirPinKnob, OPEN, d, 75);
    steps++;

    if (!isBlocked()) break;
    delay(10);
  }

  spinMotorDeg(stepPinKnob, dirPinKnob, CLOSE, 15, 75); 
}


double dropSeq() {
    measureDropMM();

    knobSeq();
    delay(500);
    return measureDropMM();
}

void loop() {
  while(!Serial.available()) blinkTestLight(200);
  int dec = Serial.readString().toInt();
  blinkTestLight(100);
  
  switch (dec) {
    case UP_UNTIL_STOP:
      signalReceived();

      while(Serial.readString().toInt() != FLAG_STOP) {
        upSeq();
      }
      break;

     case LOWER_UNTIL_STOP:
      signalReceived();
      measureDropMM();
      break;

     case DROP_SEQ:
      //signalReceived();
      Serial.print(dropSeq());
      break;

     default:
      Serial.print(dec);
  }
}
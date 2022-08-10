#define BAUDRATE 115200

//serial flags
#define FLAG_OK 200
#define FLAG_STOP 201
#define FLAG_INVALID 404

//serial constants
#define DP 2
const char SEP = '|';

//switch cases
#define UP_UNTIL_STOP 101
#define LOWER_UNTIL_STOP 102
#define LASER_CALIBRATION_SEQ 103
#define PH_CALIBRATION_SEQ 104
#define DROP_SEQ 105
#define LONG_DRIP_SEQ 106

#define LASER_CALIBRATION_COUNT 3
#define PH_CALIBRATION_COUNT 3

//Sensor pins
#define testPin 13
#define laserDiodePin 4
#define laserSensorPin 53
#define pHPin A0
#define pHTempPin A2

//pH parameters
#define FILTER_FACTOR 4
#define FILTER_PASSES 5000
#define FILTER_SETTLE 50
#define FILTER_AVG 30

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

//scaffold parameters
#define PITCH 8 //pitch
#define VERT_BUFFER 0.35 //vertical buffer
#define UP HIGH
#define DOWN LOW

//knob parameters
#define OPEN LOW
#define CLOSE HIGH

void setup() {
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

  digitalWrite(laserDiodePin, HIGH);
  Serial.begin(BAUDRATE);
}

//I/O functions
void blinkTestLight(int d) {
  digitalWrite(testPin, HIGH);
  delay(d);
  digitalWrite(testPin, LOW);
  delay(d);
}


int isBlocked() {
  return digitalRead(laserSensorPin);
}

//Serial functions
int waitForFlag() {
  while (!Serial.available()) blinkTestLight(200);
  blinkTestLight(100);

  return Serial.readString().toInt();
}

void signalReceived() {
  Serial.println(FLAG_OK);
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

void spinMotorMM(int stepPin, int dirPin, int dir, double heightMM, double spd) {
  double steps = heightMM / double(PITCH) * PULSE;
  
  spinMotorSteps(stepPin, dirPin, dir, int(steps), spd);
}

//analog filtering and stabilisation
int filterResult(int a) {
  return a >> FILTER_FACTOR;
}

double filterAnalog(int analogPin) {
  unsigned long total = 0;
  int a = 0;
  
  for (int j = 0; j < FILTER_SETTLE + FILTER_AVG; j++) {
    for (int i = 0; i < FILTER_PASSES; i++) {
      a = a - (filterResult(a)) + analogRead(analogPin);
    }

    if (j >= FILTER_SETTLE) total += filterResult(a);
  }

  return double(total) / FILTER_AVG;
}

double analogAvg(int analogPin, int avgCount) {
  double total = 0;

  for (int i = 0; i < avgCount; i++) {
    total += filterAnalog(analogPin);
  }
  return total / avgCount;
}

//pH conversion from analog
double currentPH(double a) {    //Siyuan: added this to convert analog to pH
  //Serial.println("Analog reading: " + String(a));
  return a * -0.02602 + 20.69362;
}

//Measurement
double measureDropMM() {
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

  spinMotorMM(stepPinVert, dirPinVert, DOWN, VERT_BUFFER, 10);
  
  return s * d + 0.35;
}

//Sequences
void upSeq() {
  spinMotorMM(stepPinVert, dirPinVert, UP, 1, 80);
}

double laserCalSeq() {
  signalReceived();
  measureDropMM();
  
  int d = 7;
  int steps = 0;
  while (isBlocked()) {
    spinMotorSteps(stepPinKnob, dirPinKnob, OPEN, d, 70);
    steps += d;
    if (!isBlocked()) break;
    delay(10);
  }
  while (waitForFlag() != FLAG_STOP);
  signalReceived();
  spinMotorSteps(stepPinKnob, dirPinKnob, CLOSE, steps, 75);
  return measureDropMM(); 
}

void knobSeq(int longDrip = 0) {
  int d = 1;
  if (longDrip){
    spinMotorSteps(stepPinKnob, dirPinKnob, OPEN, 1600, 70);
    delay(500);
    spinMotorSteps(stepPinKnob, dirPinKnob, CLOSE, 1600, 70);
  }
  else{
    while (true) {
      while(isBlocked()) {
        spinMotorSteps(stepPinKnob, dirPinKnob, OPEN, d, 75);
        delay(10);
      }
      spinMotorSteps(stepPinKnob, dirPinKnob, OPEN, 4, 75); //Siyuan: changed the code to let the knob keep turning for a few steps before closing it, so as to ensure 1 drop to fall
  
      //if (longDrip) {
       //spinMotorSteps(stepPinKnob, dirPinKnob, OPEN, d, 70);
       //delay(1000);
       //spinMotorSteps(stepPinKnob, dirPinKnob, CLOSE, d, 75);
      //}
     if (!isBlocked()) {
        spinMotorDeg(stepPinKnob, dirPinKnob, CLOSE, 35, 75); 
        break;
     }
   }
 }
}


String dropSeq(int longDrip = 0) {
    signalReceived();
    measureDropMM(); //isBlocked()=1
    knobSeq(longDrip); //isBlocked()=0
    delay(500);
    double distance = measureDropMM(); //isBlocked()=1, distance>0
    //while (distance < 0) {
      //knobSeq(); 
      //delay(500);
//      distance = measureDropMM();
//    } Siyuan: commented this while loop cuz if everything runs smoothly it wouldnt even be executed

    double a=500;
    //double a = filterAnalog(pHPin);
    return String(distance, DP) + String(SEP) + String(a, DP);  //Siyuan: added the analog value display
}

void loop() {
  int dec = waitForFlag();

  switch (dec) {
    case UP_UNTIL_STOP:
      signalReceived();

      while (true) {
        while(!Serial.available()) upSeq();
        if (Serial.readString().toInt() == FLAG_STOP){
          signalReceived();
          break;
        }
      }
      break;

     case LOWER_UNTIL_STOP:
      Serial.println(measureDropMM());
      
      break;

     case LASER_CALIBRATION_SEQ:
      Serial.println(laserCalSeq());
      
      break;

     case PH_CALIBRATION_SEQ:
      while (true) {
        signalReceived();
        double a=filterAnalog(pHPin);
        Serial.println(a);
        //Serial.println(currentPH(a));
        //Serial.print(analogAvg(pHPin, PH_CALIBRATION_COUNT));

        int nextFlag = waitForFlag();
        if (nextFlag == FLAG_STOP) break;
      }

      break;
      
     case DROP_SEQ:
      Serial.println(dropSeq());
      break;

     //Junius: Added flag 106 for long drip
     case LONG_DRIP_SEQ:
      Serial.println(dropSeq(1)); 
      break;
     
     default:
      Serial.println(FLAG_INVALID);
      break;
  }
}

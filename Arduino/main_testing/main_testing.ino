#define BAUDRATE 115200

//serial flags
#define FLAG_INIT 69
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
#define DEMO_SEQ 107
#define LASER_ON_SEQ 108

#define LASER_CALIBRATION_COUNT 3
#define PH_CALIBRATION_COUNT 3

//Sensor pins
#define testPin 13

double mlLeft = 0;
double mlCurrent = 0;

void setup() {
  mlLeft = 260.6;
  mlCurrent = 0;

  pinMode(testPin, OUTPUT);

  Serial.begin(BAUDRATE);
  Serial.print(FLAG_INIT);
}

//I/O functions
void blinkTestLight(int d) {
  digitalWrite(testPin, HIGH);
  delay(d);
  digitalWrite(testPin, LOW);
  delay(d);
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

//Measurement
double measureDropMM() {
  return 0.5212;
}

double measureAnalog() {
  return 603.67 - 0.422947 * mlCurrent;
}

//Sequences
double laserCalSeq() {
  signalReceived();
  while (waitForFlag() != FLAG_STOP);
  signalReceived();
  return measureDropMM(); 
}

String dropSeq(int longDrip = 0) {
    signalReceived();
    delay(500);
    double distance = measureDropMM() * (1 + longDrip * 4); //isBlocked()=1, distance>0
    mlCurrent += distance;

    delay(1000);
    double a = measureAnalog();
    return String(distance, DP) + String(SEP) + String(a, DP);  //Siyuan: added the analog value display
}

String demoSeq() {
  signalReceived();
  delay(2500);
  return String(measureDropMM(), DP) + String(SEP) + String(0, DP);
}

void laserOnSeq() {
    delay(5000);
    signalReceived();
}

void loop() {
  int dec = waitForFlag();

  switch (dec) {
    case UP_UNTIL_STOP:
      signalReceived();

      while (true) {
        while(!Serial.available());
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
        double a = measureAnalog();
        Serial.println(a);
        
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
    
    case DEMO_SEQ:
      Serial.println(demoSeq());
      break;
    
    //Siyuan: Added flag 108 for turning on laser 5 secs (for adjusting light sensor positions)
    case LASER_ON_SEQ:
      laserOnSeq();
      break;

    default:
      Serial.println(FLAG_INVALID);
      break;
  }
}

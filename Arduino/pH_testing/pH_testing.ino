#include <SimpleKalmanFilter.h>

#define pHPin A0
#define FILTER_FACTOR 4
#define FILTER_PASSES 5000
#define FILTER_AVG 10
#define FILTER_THRESH 5
int a = 0;
SimpleKalmanFilter kf(100, 50, 0.01);

void setup() {
  Serial.begin(115200);
  //+9V DC minimum to Arduino for stable analog readings
  analogReference(DEFAULT);
}

int filterResult(int a) {
  //Serial.println(String(a>>FILTER_FACTOR))
  return a >> FILTER_FACTOR;
}

int passArr(int *vals, int n) {
   int valMin = 1024, valMax = -1;
   int v;
   for (int i = 0; i < n; i++) {
    v = vals[i];
    Serial.print(String(v) + " ");
    if (v < valMin) valMin = v;
    if (v > valMax) valMax = v;
   }

   Serial.println("\nmin: " + String(valMin) + ", max: " + String(valMax));
   return (valMax - valMin) < FILTER_THRESH;
}

double avgArr(int *vals, int n) {
  double total = 0;
  
  for (int i = 0; i < n; i++) {
    total += (double) vals[i];  
  }

  return total / (double) n;
}

double filterAnalog(int analogPin) {
  int count = 0, pass = 0;
  int *prevVals = (int *) malloc(sizeof(int) * FILTER_AVG);

  while (!pass) {
    for (int i = 0; i < FILTER_PASSES; i++) a = a - (filterResult(a)) + kf.updateEstimate(analogRead(analogPin));
    
    memcpy(&prevVals[1], prevVals, sizeof(int) * (FILTER_AVG - 1));
    prevVals[0] = filterResult(a);

    if (count++ < FILTER_AVG) continue;
    
    pass = passArr(prevVals, FILTER_AVG);
    Serial.println("pass: " + String(pass));
  }
  
  double avg = avgArr(prevVals, FILTER_AVG);
  Serial.println("avg: " + String(avg));
  free(prevVals);
  return avg;
}

double currentPH() {
  double a = filterAnalog(pHPin);
  Serial.println("Analog reading: " + String(a));
  return a * -0.02587 + 20.82834885;
}

void loop() {
  Serial.println("Current pH: " + String(currentPH(), 2));
  delay(5000);
}

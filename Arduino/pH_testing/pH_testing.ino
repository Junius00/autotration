#define pHPin A0
#define FILTER_FACTOR 4
#define FILTER_PASSES 7500
#define FILTER_SETTLE 80
#define FILTER_AVG 60

int a = 0;

void setup() {
  Serial.begin(9600);
  //+5V to AREF, 0V to GND
  analogReference(EXTERNAL);

}

int filterResult(int a) {
  return a >> FILTER_FACTOR;
}

double filterAnalog(int analogPin) {
  unsigned long total = 0;
  
  for (int j = 0; j < FILTER_SETTLE + FILTER_AVG; j++) {
    for (int i = 0; i < FILTER_PASSES; i++) {
      a = a - (filterResult(a)) + analogRead(analogPin);
    }

    Serial.println("Finished pass " + String(j+1) + ", a: " + String(filterResult(a)));
    if (j >= FILTER_SETTLE) total += filterResult(a);
  }

  return double(total) / FILTER_AVG;
}

double currentPH() {
  double a = filterAnalog(pHPin);
  Serial.println("Analog reading: " + String(a));
  return a * -0.02727 + 20.6909;
}

void loop() {
  Serial.println("Current pH: " + String(currentPH(), 2));
}

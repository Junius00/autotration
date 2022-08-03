#define pHPin A0
#define FILTER_FACTOR 4
#define FILTER_PASSES 5000
#define FILTER_SETTLE 50
#define FILTER_AVG 30

int a = 0;

void setup() {
  Serial.begin(9600);
  //+9V DC minimum to Arduino for stable analog readings
  analogReference(DEFAULT);

}

int filterResult(int a) {
  //Serial.println(String(a>>FILTER_FACTOR))
  return a >> FILTER_FACTOR;
}

double avgAnalog(int analogPin){
  double total=0;
  for (int i=0;i<5;i++){
    total+=filterAnalog(analogPin);
  }
  return total / 5;
}
double filterAnalog(int analogPin) {
  unsigned long total = 0;
  for (int j = 0; j < FILTER_SETTLE + FILTER_AVG; j++) {
    for (int i = 0; i < FILTER_PASSES; i++) {
      a = a - (filterResult(a)) + analogRead(analogPin);
    }

    //Serial.println("Finished pass " + String(j+1) + ", a: " + String(filterResult(a)));
    if (j >= FILTER_SETTLE) total += filterResult(a);
  }

  return double(total) / FILTER_AVG;
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

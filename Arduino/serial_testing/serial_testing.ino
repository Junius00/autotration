#define testPin 13

void setup() {
  // put your setup code here, to run once:
  pinMode(testPin, OUTPUT);
  Serial.begin(115200);
  Serial.print(69);
}

void blinkLight(int d) {
 digitalWrite(testPin, HIGH);
 delay(d);
 digitalWrite(testPin, LOW);
 delay(d);
}
void loop() {
  // put your main code here, to run repeatedly:
  while (!Serial.available()) blinkLight(500);

  for (int i = 0; i < 3; i++) blinkLight(100);
  int s = Serial.readString().toInt();
  Serial.print(s);
  
}

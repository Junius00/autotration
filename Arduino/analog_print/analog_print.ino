int a;

void setup() {
  // put your setup code here, to run once:
  pinMode(A0, INPUT);
  analogReference(DEFAULT);

  Serial.begin(9600);
  a = 0;
}

void loop() {
  // put your main code here, to run repeatedly:
  int r = analogRead(A0);
  //Serial.println(r);
  
  a = a - (a >> 4) + r;
  Serial.println(a >> 4);
  delay(200);
}

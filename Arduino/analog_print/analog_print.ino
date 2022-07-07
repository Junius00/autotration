int a;

void setup() {
  // put your setup code here, to run once:
  pinMode(A0, INPUT);
  analogReference(EXTERNAL);

  Serial.begin(9600);
  a = 0;
}

void loop() {
  // put your main code here, to run repeatedly:
  int r = analogRead(A0);
  a = a - (a >> 4) + r;
  Serial.println(a >> 4);
}

int ledPin = 13;
int incomingByte;

void setup() {
  Serial.begin(9600);
  
  pinMode(ledPin, OUTPUT);     
}

void loop() {
  if (Serial.available() > 0) {
    incomingByte = Serial.read();
    
    if (incomingByte == 'H') {
      digitalWrite(ledPin, HIGH);
      
      Serial.println("on");
    } else if (incomingByte == 'L') {
      digitalWrite(ledPin, LOW);
      
      Serial.println("off");
    }
  }
}

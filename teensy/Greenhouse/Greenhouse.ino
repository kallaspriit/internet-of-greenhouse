int ledPin = 13;
int incomingByte;
int lighting = 0;

void setup() {
  Serial.begin(9600);
  
  pinMode(ledPin, OUTPUT);     
}

void loop() {
  /*if (Serial.available() > 0) {
    incomingByte = Serial.read();
    
    if (incomingByte == 'H') {
      digitalWrite(ledPin, HIGH);
      
      Serial.println("on");
    } else if (incomingByte == 'L') {
      digitalWrite(ledPin, LOW);
      
      Serial.println("off");
    }
  }*/
  
  String str;
  String param;
  int value;
  
  if (readFromSerial(str)) {
    if (parseFormattedStr(str, param, value) == 0) {
      handleCommand(param, value); 
    }
  }
}

void handleCommand(String param, int value) {
  if (param == "lighting") {
    if (value == 1) {
      lighting = 1;
    } else {
      lighting = 0;
    }
    
    digitalWrite(ledPin, lighting ? HIGH : LOW);
  } else if (param == "get-lighting") {
    Serial.print("lighting:");
    Serial.println(lighting);
  } else {
    Serial.print("- Unimplemented command: '");
    Serial.print(param);
    Serial.println("'");
  }
}

int readFromSerial(String& str) {
  char chr;
  int cc = 0;
  
  while (Serial.available() > 0) {
    chr = Serial.read();
    str += chr;
    cc++;
  }
  
  return cc;
}

int parseFormattedStr(String str, String& paramName, int& value) {
  bool colonFound = false;
  String nrStr;
  
  for (int i=0; i<str.length(); i++) {
    if (str[i] != ':') {
      if (!colonFound)
        paramName += str[i];
      else
        nrStr += str[i];
    } else {
      colonFound = true;
    }
  }

  value = nrStr.toInt();  
  return 0;
}

int ledPin = 13;
int incomingByte;
int irrigation = 0;
int lighting = 0;
int oxygen = 0;
int lightLevel = 0;

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
  } else if (param == "get-irrigation") {
    Serial.print("irrigation:");
    Serial.println(irrigation);
  } else if (param == "get-lighting") {
    Serial.print("lighting:");
    Serial.println(lighting);
  } else if (param == "get-oxygen") {
    Serial.print("oxygen:");
    Serial.println(oxygen);
  } else if (param == "get-light-level") {
    lightLevel += random(-25, 25);
    
    if (lightLevel < 0) {
      lightLevel = 0; 
    } else if (lightLevel > 255) {
      lightLevel = 255; 
    }
    
    Serial.print("light-level:");
    Serial.println(lightLevel);
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

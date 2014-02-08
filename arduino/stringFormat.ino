


void sendFormattedStr(String name, int value) {
  Serial.println("<" + name + ":" + value + ">");
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
  
  if (str[0] != '<') return -1;
  
  for (int i=1; i<str.length(); i++) {
    if (str[i] == '>') break;
    
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

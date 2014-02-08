#include "action.h"



void startCommunication() {
  Serial.begin(57600);
  while (!Serial) {
    // wait for serial port to connect. Needed for Leonardo only
  }
}

void receiveData(Action& action, int& val) {
  action = None;
  String str;
  String valName;
  
  if (readFromSerial(str)) {
    parseFormattedStr(str, valName, val);
    stringToAction(valName, action);
  }
}


void stringToAction(String& str, Action& action) {
  if (str == "lighting")
    action = SetLightsState;
  else if (str == "get-is-lighting")
    action = GetLightsState;
  else if (str == "irrigation")
    action = SetPumpState;
  else if (str == "get-is-irrigation")
    action = GetPumpState;
  else if (str == "oxygen")
    action = SetAirState;
  else if (str == "get-is-oxygen")
    action = GetAirState;
  else if (str == "valve")
    action = SetValveState;
  else if (str == "get-is-valve")
    action = GetValveState;
  else if (str == "get-light-level")
    action = GetLightLevel;
  else if (str == "get-moisture-level")
    action = GetMoistureLevel;
  else
    action = Unknown;
}





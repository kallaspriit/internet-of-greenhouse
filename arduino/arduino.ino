#include "action.h"


void setup() {
  startCommunication();
}


void loop() {
  Action action = None;
  int val;
  
  receiveData(action, val);
  
  
  switch (action) {
    case None:
      break;
    case SetLightsState:
      break;
    case GetLightsState:
      sendFormattedStr("lighting", 0);
      break;
    case SetPumpState:
      break;
    case GetPumpState:
      sendFormattedStr("irrigation", 0);
      break;
    case SetAirState:
      break;
    case GetAirState:
      sendFormattedStr("oxygen", 0);
      break;
    case SetValveState:
      break;
    case GetValveState:
      sendFormattedStr("valve", 0);
      break;
    case GetLightLevel:
      sendFormattedStr("light-level", 0);
      break;
    case GetMoistureLevel:
      sendFormattedStr("moisture-level", 0);
      break;
    default:
      break;
  }
  
  
  delay(1000);
}

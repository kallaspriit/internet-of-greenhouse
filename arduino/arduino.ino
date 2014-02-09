#include "action.h"

int lastPumpVal = 0;
int lastLightsVal = 0;
int lastAirVal = 0;


void setup() {
  startCommunication();
}


void loop() {
  Action action = None;
  int val;
  int sensorValue;
  
  receiveData(action, val);
  

  switch (action) {
    case None:
      break;
    case SetLightsState:
      lastLightsVal = val;
      analogWrite(3, val);
      break;
    case GetLightsState:
      sendFormattedStr("lighting", lastLightsVal);
      break;
    case SetPumpState:
      lastPumpVal = val;
      analogWrite(5, val);
      break;
    case GetPumpState:
      sendFormattedStr("irrigation", lastPumpVal);
      break;
    case SetAirState:
      lastAirVal = val;
      analogWrite(4, val);
      break;
    case GetAirState:
      sendFormattedStr("oxygen", lastAirVal);
      break;
    case SetValveState:
      break;
    case GetValveState:
      sendFormattedStr("valve", 0);
      break;
    case GetLightLevel:
      sensorValue = analogRead(A5);
      sendFormattedStr("light-level", sensorValue);
      break;
    case GetMoistureLevel:
      sendFormattedStr("moisture-level", 0);
      break;
  }

}

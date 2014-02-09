#include "action.h"

#define LedsPin 3
#define PumpPin 5
#define AirPumpPin 4
#define LightSensorPin A5


int lastPumpVal = 0;
int lastLightsVal = 0;
int lastAirVal = 0;

unsigned long old_time;
unsigned long new_time;


void setup() {
  startCommunication();
}


void loop() {
  Action action = None;
  int val;
  int sensorValue;
  
  receiveData(action, val);
  
  
  if (new_time - old_time > 3000) {
    if (action == None) action = Reset;
  }
  

  switch (action) {
    case None:
      break;
    case SetLightsState:
      lastLightsVal = val;
      analogWrite(LedsPin, val);
      break;
    case GetLightsState:
      sendFormattedStr("lighting", lastLightsVal);
      break;
    case SetPumpState:
      lastPumpVal = val;
      analogWrite(PumpPin, val);
      break;
    case GetPumpState:
      sendFormattedStr("irrigation", lastPumpVal);
      break;
    case SetAirState:
      lastAirVal = val;
      analogWrite(AirPumpPin, val);
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
      sensorValue = analogRead(LightSensorPin);
      sendFormattedStr("light-level", sensorValue);
      break;
    case GetMoistureLevel:
      sendFormattedStr("moisture-level", 0);
      break;
    case Reset;
      lastLightsVal = 0;
      lastAirVal = 0;
      lastPumpVal = 0;
      analogWrite(LedsPin, 0);
      analogWrite(PumpPin, 0);
      analogWrite(AirPumpPin, 0);
      break;
    case Ping:
      old_time = new_time;
      new_time = millis();
      break;
  }

}

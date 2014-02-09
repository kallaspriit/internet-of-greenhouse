#include "action.h"

void setPwmFrequency(int pin, int divisor) {
  /*
  TIMER0B,       3 
  TIMER3A,       5 
  TIMER4D,       6 
  TIMER1A,       9 
  TIMER1B,       10 
  TIMER0A,       11 
  TIMER4A,       13 
  */
  byte mode;
  if(pin == 3 || pin == 6 || pin == 9 || pin == 10) {
    switch(divisor) {
      case 1: mode = 0x01; break;
      case 8: mode = 0x02; break;
      case 64: mode = 0x03; break;
      case 256: mode = 0x04; break;
      case 1024: mode = 0x05; break;
      default: return;
    }
    if(pin == 5 || pin == 6) {
      TCCR0B = TCCR0B & 0b11111000 | mode;
    } else {
      TCCR1B = TCCR1B & 0b11111000 | mode;
    }
  } else if(pin == 3 || pin == 11) {
    switch(divisor) {
      case 1: mode = 0x01; break;
      case 8: mode = 0x02; break;
      case 32: mode = 0x03; break;
      case 64: mode = 0x04; break;
      case 128: mode = 0x05; break;
      case 256: mode = 0x06; break;
      case 1024: mode = 0x7; break;
      default: return;
    }
    //TCCR2B = TCCR2B & 0b11111000 | mode;
  }
}

int lastPumpVal = 0;
int lastLightsVal = 0;
int lastAirVal = 0;

void setup() {
  //etPwmFrequency(3, 256);
  //TCCR0B = TCCR0B & 0b11111000 | 256;
  //setPwmFrequency(5, 256);
  TCCR3B = TCCR3B & 0b11111000 | 256;
  pinMode(4, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(5, OUTPUT);
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
      if (val == 0) {
        digitalWrite(4, HIGH);
      } else {
        digitalWrite(4, LOW);
      }      
      lastAirVal = val;
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

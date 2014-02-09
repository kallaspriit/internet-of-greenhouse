#ifndef ACTION_H_INCLUDED
#define ACTION_H_INCLUDED


typedef enum Action {
  SetLightsState,
  GetLightsState,
  
  SetPumpState,
  GetPumpState,
  
  SetAirState,
  GetAirState,
  
  SetValveState,
  GetValveState,
  
  GetLightLevel,
  GetMoistureLevel,
  
  Ping,
  Reset,
  
  None,
  Unknown
};



#endif

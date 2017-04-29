#include "DS18.h"
#include <Adafruit_GFX.h>
#include <gfxfont.h>
#include <Adafruit_SSD1306.h>
#include <DuoBLE.h>


const int OLED_CLK   = D5;
const int OLED_MOSI  = D1;
const int OLED_RESET = D2;
const int OLED_DC    = D3;
const int OLED_CS    = D4;

Adafruit_SSD1306 display(OLED_MOSI, OLED_CLK, OLED_DC, OLED_RESET, OLED_CS);

// Disable WiFi (for now)
SYSTEM_MODE(MANUAL);

// Define a service and its data: The "numbers" are randomly generated from https://www.uuidgenerator.net/
BLEService tempService("208c9c6f-dcf8-4c1f-8a43-8f1674c21d6e");
BLECharacteristic fanChangeCharacteristic("a7360086-35eb-405e-8fa9-5060fc4f60e8", ATT_PROPERTY_READ | ATT_PROPERTY_WRITE);
BLECharacteristic oledDisplayCharacteristic("de356095-f965-4a5f-9418-41a48ea6718d" , ATT_PROPERTY_READ | ATT_PROPERTY_WRITE);
// The temperature charactierstic reports temperature in 0.1 deg C.  For example, 0xE6 == 230 (decimal) => 23.00 degrees C
// (The DS18B20 only is accurate to about +- 0.5 degrees C over typical temperature ranges)
BLECharacteristic tempCharacteristic("bd4cf86c-f315-4864-9c89-8fb5d01463cf", ATT_PROPERTY_READ | ATT_PROPERTY_NOTIFY, 2,2);
BLECharacteristic rotationStrengthCharacteristic("11c4156d-2bbb-4c52-8dc0-722d789d8e5a" , ATT_PROPERTY_READ | ATT_PROPERTY_WRITE);
// 3-4 Letter string to help spot device
 const char * const deviceName = "FOO";

// ***** Data and objects for the sensor
// Assumes the DS18 is connected to D6.
DS18 sensor(D6);  
uint8_t sensorAddress[8];


// Timer to periodically read and update temperature
void readTemperature();
void printOnScreen();
Timer tempUpdateTimer(4000, readTemperature);


// Update the temperature characteristic's value
// Updated periodically with a timer, so no "callback" needed.
void updateTempCharacteristicValue(int newTemp) {
  byte value[2];
  value[0] = newTemp>>8;
  value[1] = newTemp>>0;
  tempCharacteristic.setValue(value, 2);
  tempCharacteristic.sendNotify();
}


void readTemperature() {
  if (sensor.read(sensorAddress)) {
    Serial.printf("Temperature %.2f C %.2f F \n", sensor.celsius(), sensor.fahrenheit());
    updateTempCharacteristicValue(sensor.celsius()*10);
    int decimal = (int)((sensor.celsius()-((int)sensor.celsius())/1.0) * 100);
    printOnScreen((int)sensor.celsius(),decimal);
  } else {
    // Something went wrong
    Serial.println("Sensor Read Failed");
  }  
}



// Declare a servo object:
Servo servo;
int count =0;
int toggleFan = 0;
int currentTemperature = 0;
int powerIndex = 120;

void rotateFan() {
    // publish the event that will trigger our Webhook
    if (count % 2 == 0){
        servo.write(powerIndex);
        count += 1;
    }
    else{
        servo.write(0);
        count += 1;
    }
}

void rotateStrength(int choice) {
  switch (choice) {
    case 1:
      {powerIndex = 40;}
    case 2:
      {powerIndex = 80;}
    case 3:
      {powerIndex = 80;}
  }

}



Timer motorTimer(360, rotateFan);

void setup() {
  delay(2000);
  display.begin(SSD1306_SWITCHCAPVCC);
  Serial.begin(9600);
  servo.attach( D0 );

  // II. Sensor configuration and reading initial data (updates temperature characteristic too)
  // Assuming only one sensor --- do a read to get its address
  while(!sensor.read()) {
    Serial.println("No Sensor found!");
  }
  // Save address & Read the current temperature
  sensor.addr(sensorAddress);
  readTemperature(); 

  Serial.println("Start program");
  byte fanValue[] = {0};  // A 1 byte integer value for on or off
  fanChangeCharacteristic.setValue(fanValue,1);
  fanChangeCharacteristic.setCallback(fanChangeCallback);
  tempService.addCharacteristic(fanChangeCharacteristic);
  byte oledValue[] = {0,0,0,0};  // One byte for integer value and one for decimal
  oledDisplayCharacteristic.setValue(oledValue,4);
  oledDisplayCharacteristic.setCallback(oledChangeCallback);
  tempService.addCharacteristic(oledDisplayCharacteristic);
  byte strengthValue[] = {0};  // A 1 byte integer value for on or off
  rotationStrengthCharacteristic.setValue(fanValue,1);
  rotationStrengthCharacteristic.setCallback(rotationStrengthCallback);
  tempService.addCharacteristic(rotationStrengthCharacteristic);
    // III. BLE Service and characteristic configuration
  tempService.addCharacteristic(tempCharacteristic);

  // Add the Service
  DuoBLE.addService(tempService);
  // Start stack
  DuoBLE.begin();
  // The Advertised name and "local" name should have some agreement
  DuoBLE.advertisingDataAddName(ADVERTISEMENT, deviceName);
  DuoBLE.setName(deviceName);
  // Start advertising.
  DuoBLE.startAdvertising();
  Serial.println("BLE start advertising.");

  // V. Start to periodically read the temperature
  tempUpdateTimer.start();

}

void loop() {

}

//Displays the current temperature on the OLED screen.
void printOnScreen(int temperature, int decimal){
  currentTemperature = temperature;
  if (temperature == 255){
    display.clearDisplay();   // clears the screen and buffer
  }
  else{
  display.clearDisplay();   // clears the screen and buffer
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(0,0);
  float tempF = temperature/1.0 + decimal/100.0;
  String stringTemp =  String(tempF, 1);
  String line = "Temp: " + stringTemp;
  display.println(line);
  display.display();
  display.startscrollright(0,31);
  }
}

//Callback to change the fan from on too off or vice versa once a value has been written.
void fanChangeCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason){
   Serial.print("Fan Change Characteristic; Reason: ");
   Serial.println(reason);
  int commands[] = {-1,-1,-1,-1,-1};
  if(reason == POSTWRITE) {
       byte value[4];
       int bytes = fanChangeCharacteristic.getValue(value, 4);
       Serial.print("New Value written: ");
       for(int i=0;i<1;i++){
         Serial.print(value[i]);
         Serial.print(" ");
         commands[i] = int(value[i]);
         toggleFan ++;
         changeFanState(toggleFan);
       }

     }
     Serial.println();
}

//Callback to print the current temperature, gotten from the weather api, on screen
void oledChangeCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason){
   Serial.print("OLED Change Characteristic; Reason: ");
   Serial.println(reason);
  int commands[] = {-1,-1,-1,-1,-1};
  if(reason == POSTWRITE) {
       byte value[4];
       int bytes = oledDisplayCharacteristic.getValue(value, 4);
       Serial.print("New Value written: ");
       for(int i=0;i<1;i++){
         Serial.print(value[i]);
         Serial.print(" ");
         commands[i] = int(value[i]);
       }
       printOnScreen(commands[0],commands[1]);
       

     }
     Serial.println();
}

//Callback to change the fan from on too off or vice versa once a value has been written.
void rotationStrengthCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason){
   Serial.print("Fan Change Characteristic; Reason: ");
   Serial.println(reason);
  int commands[] = {-1,-1,-1,-1,-1};
  if(reason == POSTWRITE) {
       byte value[4];
       int bytes = fanChangeCharacteristic.getValue(value, 4);
       Serial.print("New Value written: ");
       for(int i=0;i<1;i++){
         Serial.print(value[i]);
         Serial.print(" ");
         commands[i] = int(value[i]);
       }
       rotateStrength(commands[0]);
     }
     Serial.println();
}


//Each call to chance the fan will also control whether the LED screen displays the temperature- the display will not turn on while the fan is running.
void changeFanState(int onOff){
  if (onOff % 2 == 0){
    Serial.println("Fan is turn off");
    motorTimer.stop();
  }
  else{
    motorTimer.start();
    Serial.println("Fan is turn on");
  }
}

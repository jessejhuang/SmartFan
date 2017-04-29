#include <Adafruit_GFX.h>
#include <gfxfont.h>
#include <Adafruit_SSD1306.h>
#include <DuoBLE.h>

const int OLED_CLK   = D0;
const int OLED_MOSI  = D1;
const int OLED_RESET = D2;
const int OLED_DC    = D3;
const int OLED_CS    = D4;

Adafruit_SSD1306 display(OLED_MOSI, OLED_CLK, OLED_DC, OLED_RESET, OLED_CS);

// Disable WiFi (for now)
SYSTEM_MODE(MANUAL);

// 3-4 Letter string to help spot device
 const char * const deviceName = "FOO";

// Define a service and its data: The "numbers" are randomly generated from https://www.uuidgenerator.net/
BLEService simpleCustomService("208c9c6f-dcf8-4c1f-8a43-8f1674c21d6e");
BLECharacteristic fanChangeCharacteristic("a7360086-35eb-405e-8fa9-5060fc4f60e8", ATT_PROPERTY_READ | ATT_PROPERTY_WRITE);
BLECharacteristic oledDisplayCharacteristic("de356095-f965-4a5f-9418-41a48ea6718d" , ATT_PROPERTY_READ | ATT_PROPERTY_WRITE);


// Declare a servo object:
Servo servo;
int count =0;
int toggleFan = 0;
int currentTemperature = 0;
void rotateFan() {
    // publish the event that will trigger our Webhook
    if (count % 2 == 0){
        servo.write(120);
        count += 1;
    }
    else{
        servo.write(0);
        count += 1;
    }
}

Timer motorTimer(360, rotateFan);

void setup() {
  delay(2000);
  //display.begin(SSD1306_SWITCHCAPVCC);
  Serial.begin(9600);
  servo.attach( D0 );

  //Setup for charateristic
  //pinMode(ON_PIN, INPUT_PULLUP);
  //attachInterrupt( digitalPinToInterrupt(ON_PIN), onChanged, CHANGE);
  //pinMode(OFF_PIN, INPUT_PULLUP);
  //attachInterrupt( digitalPinToInterrupt(OFF_PIN), offChanged, CHANGE);
  Serial.println("Start program");
  byte fanValue[] = {0};  // A 1 byte integer value for on or off
  fanChangeCharacteristic.setValue(fanValue,1);
  fanChangeCharacteristic.setCallback(fanChangeCallback);
  simpleCustomService.addCharacteristic(fanChangeCharacteristic);
  byte oledValue[] = {0,0,0,0};  // One byte for integer value and one for decimal
  oledDisplayCharacteristic.setValue(oledValue,4);
  oledDisplayCharacteristic.setCallback(oledChangeCallback);
  simpleCustomService.addCharacteristic(oledDisplayCharacteristic);

  // Add the Service
  DuoBLE.addService(simpleCustomService);
  // Start stack
  DuoBLE.begin();
  // The Advertised name and "local" name should have some agreement
  DuoBLE.advertisingDataAddName(ADVERTISEMENT, deviceName);
  DuoBLE.setName(deviceName);
  // Start advertising.
  DuoBLE.startAdvertising();
  Serial.println("BLE start advertising.");

}

void loop() {
  //delay(8000);
  //changeFanState(0);
  //printOnScreen (823);
  //delay(8000);
  //changeFanState(1);
  //printOnScreen (998);
}

//Displays the current temperature on the OLED screen.
void printOnScreen(int temperature){
  currentTemperature = temperature;
  if (temperature == -1111){
    display.clearDisplay();   // clears the screen and buffer
  }
  else{
  display.clearDisplay();   // clears the screen and buffer
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(0,0);
  float tempF = temperature/1.0;
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
         currentTemperature = commands[0];
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

     }
     Serial.println();
}


//Each call to chance the fan will also control whether the LED screen displays the temperature- the display will not turn on while the fan is running.
void changeFanState(int onOff){
  if (onOff % 2 == 0){
    motorTimer.stop();
    //printOnScreen(currentTemperature);
  }
  else{
    motorTimer.start();
    //display.clearDisplay();
    //display.end();
  }
}

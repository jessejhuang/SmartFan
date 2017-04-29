/*
   *Assignment 11 javascript for Lamp App
   *Jesse Huang, Bo Huang
   * */

console.log("starting index.js")

var SCAN_TIME = 7000;           // Scan for 7 seconds
var CONNECTION_TIMEOUT = 7000;  // Wait for 7 seconds for a valid connection

// *********   Global variables used for all IDs that are used in multiple functions
var refreshDevicesModal = null;
var connectingModal = null;
var deviceList = null;
var deviceObjectMap = null;
var pageNavigator = null;
var connectingDevice = null;
var connectionTimeout = null;

var offsetValue = 2;
var alarmTime = new Date("April 12, 2017 00:00:00").getTime();
var countDownTime = new Date("April 12, 2017 00:00:00").getTime();
var alarmCountDown;
var alarmOn;
var countDownOn;
var timerCountDown;

var simpleCustomService       = "208c9c6f-dcf8-4c1f-8a43-8f1674c21d6e";
var colorChangeCharacteristic = "a7360086-35eb-405e-8fa9-5060fc4f60e8";

// *********   Functions for scanning and scan related events


function scanFailed() {
    refreshDevicesModal.hide();
}

function scanStop() {
    ble.stopScan();
    refreshDevicesModal.hide();
}

//connection or read write failure print to the console
var failure = function (){
    console.log("Fail");
}

var success = function (){
    console.log("success");
}

//ensure the time format on the clock;
function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function startTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  // add a zero in front of numbers<10
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('time').innerHTML = "Clock: "+h + ":" + m + ":" + s;
  t = setTimeout(function() {
    startTime()
  }, 500);
}

function setTimeAlarm(){
    var hour = parseInt(document.getElementById("setHour").value);
    var minute = parseInt(document.getElementById("setMinute").value);
    var second = parseInt(document.getElementById("setSecond").value);

    alarmOn = new Date(alarmTime);
    alarmOn.setHours(alarmOn.getHours()+hour);
    alarmOn.setMinutes(alarmOn.getMinutes()+minute);
    alarmOn.setSeconds(alarmOn.getSeconds()+second);
    
    var h_on = checkTime(alarmOn.getHours());
    var m_on = checkTime(alarmOn.getMinutes());
    var s_on = checkTime(alarmOn.getSeconds());
    document.getElementById('settedTime').innerHTML = "Alarm On @  "+h_on + ":" + m_on + ":" + s_on;
}

function setTimeCountDown(){
    var second = parseInt(document.getElementById("countDownSecond").value);
    countDownOn = new Date();
    countDownOn.setSeconds(countDownOn.getSeconds()+second +offsetValue);
}

function alarmOnTime(){

    setTimeAlarm();
    // Update the count down every 1 second
    clearInterval(alarmCountDown);
    alarmCountDown = setInterval(function() {
    var now = new Date().getTime();
    var distance = alarmOn - now;
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    var hh = checkTime(hours);
    var mm = checkTime(minutes);
    var ss = checkTime(seconds);
    document.getElementById("countDownAlarmDisplay").innerHTML = "Count Down to Turn On @ " + hh + "h " + mm + "m " + ss + "s ";
    
    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(alarmCountDown);
        document.getElementById("countDownAlarmDisplay").innerHTML = "TIME EXPIRED & Light On";
        FadeColorOn();
    }
}, 1000);

}

function alarmOffTime(){

    setTimeAlarm();
    // Update the count down every 1 second
    clearInterval(alarmCountDown);
    alarmCountDown = setInterval(function() {
    var now = new Date().getTime();
    var distance = alarmOn - now;
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    document.getElementById("countDownAlarmDisplay").innerHTML = "Count Down to Turn Off @ " + hours + "h " + minutes + "m " + seconds + "s ";
    
    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(alarmCountDown);
        document.getElementById("countDownAlarmDisplay").innerHTML = "TIME EXPIRED & Light Off";
        FadeColorOff();
    }
}, 1000);

}

// timer to count down in second to turn on/off the lamp when time is up
function onInNTime(){
    setTimeCountDown();
    clearInterval(timerCountDown);
    timerCountDown = setInterval(function() {
    var now = new Date().getTime();
    var distance = countDownOn - now;
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    var ss = seconds;
    document.getElementById("countDownSecondDisplay").innerHTML = "Turn on @" + ss + "s ";
    
    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(timerCountDown);
        document.getElementById("countDownSecondDisplay").innerHTML = "TIME EXPIRED & Light On";
        FadeColorOn();
    }
}, 1000);

}

function offInNTime(){
    setTimeCountDown();
    clearInterval(timerCountDown);
    timerCountDown = setInterval(function() {
    var now = new Date().getTime();
    var distance = countDownOn - now;
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    var ss = seconds;
    document.getElementById("countDownSecondDisplay").innerHTML = "Turn off @" + ss + "s ";
    
    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(timerCountDown);
        document.getElementById("countDownSecondDisplay").innerHTML = "TIME EXPIRED & Light Off";
        FadeColorOff();
    }
}, 1000);
    
}



//all the commands on turn ON/OFF lamp
function OnLight(){
    console.log("Function ONLIGHT() called");
    var onArray= new Uint8Array(1);
    onArray[0] = 188;
    //onArray[1] = 12;
    ble.write(connectingDevice.id, simpleCustomService, colorChangeCharacteristic, onArray.buffer, success, failure);
}
function OffLight(){
    console.log("Function OFFLIGHT() called");
    var onArray= new Uint8Array(1);
    onArray[0] = 189;
    //onArray[1] = 12;
    ble.write(connectingDevice.id, simpleCustomService, colorChangeCharacteristic, onArray.buffer, success, failure);
}

function FadeColorOn(){
    console.log("Function FadeColor() called");
    var fadeOnData= new Uint8Array(1);
    fadeOnData[0] = 170;
    ble.write(connectingDevice.id, simpleCustomService, colorChangeCharacteristic, fadeOnData.buffer, success, failure);
}
function FadeColorOff(){
    console.log("Function FadeColorO () called");
    var fadeOffData= new Uint8Array(1);
    fadeOffData[0] = 187;
    ble.write(connectingDevice.id, simpleCustomService, colorChangeCharacteristic, fadeOffData.buffer, success, failure);
}


// change the default color 
function ChangeColor(){
    var data= new Uint8Array(4);
    data[0] = 171;
    var display_red = parseInt(document.getElementById("setRedColor").value);
    var display_green = parseInt(document.getElementById("setGreenColor").value);
    var display_blue = parseInt(document.getElementById("setBlueColor").value);

    var red = parseInt(document.getElementById("setRedColor").value * 255/100);
    var green = parseInt(document.getElementById("setGreenColor").value * 255/100);
    var blue = parseInt(document.getElementById("setBlueColor").value * 255/100);
    data[1] = red;
    data[2] = green;
    data[3] = blue;
    console.log("Function CHANGECOLOR() called");
    ble.write(connectingDevice.id, simpleCustomService, colorChangeCharacteristic, data.buffer, success, failure);

    document.getElementById("displayRed").innerHTML = display_red;
    document.getElementById("displayGreen").innerHTML = display_green;
    document.getElementById("displayBlue").innerHTML = display_blue;
}

// change the default color and turn on the lamp
function ChangeToNewColor(){
    var data= new Uint8Array(4);
    data[0] = 171;
    var red = parseInt(document.getElementById("setRedColor").value * 255/100);
    var green = parseInt(document.getElementById("setGreenColor").value * 255/100);
    var blue = parseInt(document.getElementById("setBlueColor").value * 255/100);
    data[1] = red;
    data[2] = green;
    data[3] = blue;
    console.log("Function CHANGECOLOR() called");
    ble.write(connectingDevice.id, simpleCustomService, colorChangeCharacteristic, data.buffer, success, failure);
    var fadeOnData= new Uint8Array(1);
    fadeOnData[0] = 170;
    ble.write(connectingDevice.id, simpleCustomService, colorChangeCharacteristic, fadeOnData.buffer, success, failure);
}



function deviceDiscovered(device) {
    // Debugging: Console log of details of item
    // console.log(JSON.stringify(device));

    if(deviceObjectMap.get(device.id) == undefined ) {
        // New Device. Add it to the collection and to the window
        deviceObjectMap.set(device.id, device);

        // Identify the name or use a default
        var name = "(none)";
        if (device.name != undefined) {
            name = device.name;
        }

        // Create the Onsen List Item
        var item = ons._util.createElement('<ons-list-item modifier="chevron" tappable> ' +
            '<ons-row><ons-col><span class="list-item__title" style="font-size: 4vw;">' + device.id + '</span></ons-col></ons-row>' +
            '<ons-row><ons-col><span class="list-item__subtitle" style="font-size: 2vw;">RSSI:' + device.rssi + '</span></ons-col><ons-col><span style="font-size: 2vw;">Name: ' + name + '</span></ons-col></ons-row>' +
            '</ons-list-item>');

        // Set the callback function
        item.addEventListener('click', deviceSelected, false);

        // Associate the element in the list with the object
        item.device = device;

        // Iterate through the list and add item in place by RSSI
        var descendants = deviceList.getElementsByTagName('ons-list-item');
        var i;
        for(i=0;i<descendants.length;i++) {
            if(device.rssi > descendants[i].device.rssi) {
                descendants[i].parentNode.insertBefore(item, descendants[i]);
                return;
            }
        }
        // If it hasn't already returned, it wasn't yet inserted.
        deviceList.append(item);
    }
}

function startScan() {
    // Disable the window
    refreshDevicesModal.show();

    // Empty the list (on screen and Map)
    deviceList.innerHTML = "";
    deviceObjectMap = new Map();

    // Start the scan
    ble.scan([], SCAN_TIME, deviceDiscovered, scanFailed);

    // Re-enable the window when scan done
    setTimeout(scanStop, SCAN_TIME);
}


// var messageCounter = 0;

// ***** Button Related Functions ********
// function buttonData(buffer) {
//     var array = new Uint8Array(buffer)
//     var buttonValue = document.getElementById("buttonValue");
//     buttonValue.checked =  (array[0] != 0);
//     messageCounter++;

//     console.log("Total Messages: " + messageCounter);
// }

// function buttonDataFailed() {
//     console.log("Button Read Failed");
// }

// function readButton() {
//     ble.read(connectingDevice.id, buttonService, buttonCharacteristic, buttonData, buttonDataFailed);
// }



// ********   Functions for device connection related events

function deviceConnectionSuccess(device) {
    clearTimeout(connectionTimeout);
    connectingModal.hide();
    connectingDevice = device;
    startTime();

    // Studio 11:  Now that the device is connected, request any data that's needed
//    readButton();
    // Set up a timer to repeatedly "poll" for data.
    //connectingDevice.pollingTimer = setInterval(readButton, 1000);
}

function deviceConnectionFailure(device) {
    console.log("Device Disconnected");
    pageNavigator.popPage();
    refreshDevicesModal.hide();
    connectingDevice = null;
}

function deviceConnectionTimeout() {
    // Device connection failure
    connectingModal.hide();
    pageNavigator.popPage();
    refreshDevicesModal.hide();
    if(connectingDevice != null) {
        clearInterval(connectingDevice.pollingTimer);
        //ble.disconnect(connectingDevice.id);
    }
}

function disconnectDevice() {
    console.log("Disconnecting");
    if(connectingDevice !== null) {
        clearInterval(connectingDevice.pollingTimer);
        //ble.disconnect(connectingDevice.id);
    }
}


// ***** Function for user-interface selection of a device
function deviceSelected(evt) {
    var device = evt.currentTarget.device;
    // Initiate a connection and switch screens; Pass in the "device" object
    pageNavigator.pushPage('deviceDetails.html', {data: {device: evt.currentTarget.device}});
    connectingDevice = device;
    ble.connect(device.id, deviceConnectionSuccess, deviceConnectionFailure);
    connectionTimeout = setTimeout(deviceConnectionTimeout, CONNECTION_TIMEOUT);
}

// *****  Function for initial startup
ons.ready(function() {
    console.log("Ready");

    // Initialize global variables
    refreshDevicesModal = document.getElementById('refreshDevicesModal');
    pageNavigator = document.querySelector('#pageNavigator');
    pageNavigator.addEventListener('postpop', disconnectDevice);

    var refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click',  function() {
            console.log("Refresh; Showing modal");
            startScan();
    } );

    deviceList = document.getElementById('deviceList');

    // Add a "disconnect" when app auto-updates
    if(typeof window.phonegap !== 'undefined') {
        // Works for iOS (not Android)
        var tmp = window.phonegap.app.downloadZip;
        window.phonegap.app.downloadZip = function (options) {
            disconnectDevice();
            tmp(options);
        }
    }

    var pullHook = document.getElementById('pull-hook');
    pullHook.onAction = function(done) {
        startScan();
        // Call the "done" function in to hide the "Pull to Refresh" message (but delay just a little)
        setTimeout(done, 500);
    };
});


// *** Functions for page navigation (page change) events
document.addEventListener('init', function(event) {
    var page = event.target;

    if (page.id === 'deviceDetails') {
        // Enable the modal window
        connectingModal = document.getElementById('connectingModal');
        connectingModal.show();

        // Update the page's title bar
        page.querySelector('ons-toolbar .center').innerHTML = "Device Details";
        document.getElementById("buttonValue").addEventListener("change", function(event) {
                alert("Don't change the switch!")
                event.switch.checked = !event.switch.checked;
            });
    }
});
console.log("loaded index.js");

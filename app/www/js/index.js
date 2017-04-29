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
var alarmTime = new Date("April 29, 2017 00:00:00").getTime();
var countDownTime = new Date("April 29, 2017 00:00:00").getTime();
var alarmCountDown;
var alarmOn;
var countDownOn;
var timerCountDown;
var timeOnLoad;

var simpleCustomService       = "208c9c6f-dcf8-4c1f-8a43-8f1674c21d6e";
var fanChangeCharacteristic = "a7360086-35eb-405e-8fa9-5060fc4f60e8";
var oledDisplayCharacteristic = "de356095-f965-4a5f-9418-41a48ea6718d";

var graphData = [["Time", "Temperature"]];
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
        //FadeColorOn(); <- Change to temperature
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
        //FadeColorOff(); <- Change to temperature

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
        OnFan();
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
        OffFan();
    }
}, 1000);

}



//all the commands on turn ON/OFF lamp
function OnFan(){
    console.log("Function ONLIGHT() called");
    var onArray= new Uint8Array(1);
    onArray[0] = 188;
    //onArray[1] = 12;
    ble.write(connectingDevice.id, simpleCustomService, fanChangeCharacteristic, onArray.buffer, success, failure);
}
function OffFan(){
    console.log("Function OFFLIGHT() called");
    var onArray= new Uint8Array(1);
    onArray[0] = 189;
    //onArray[1] = 12;
    ble.write(connectingDevice.id, simpleCustomService, fanChangeCharacteristic, onArray.buffer, success, failure);
}

function readTemperature(){
  console.log("Reading temperature() called");
  var tempAndTime = ble.read(connectingDevice.id, simpleCustomService, temperatureCharacteristic, success, failure);
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
        //connectingModal.show();

        // Update the page's title bar
        page.querySelector('ons-toolbar .center').innerHTML = "Device Details";
        document.getElementById("buttonValue").addEventListener("change", function(event) {
                alert("Don't change the switch!")
                event.switch.checked = !event.switch.checked;
            });
    }
});
console.log("loaded index.js");

jQuery(document).ready(function($) {
  timeOnLoad = new Date().getTime();
  var plotGraph = setInterval(getTemperature,5000);
});

//Make an AJAX request to get the temperature from the wunderground API, and graph the result using google charts.
//In addition, send the current temperature to the redbear duo.
function getTemperature(){
  $.ajax({
  url : "http://api.wunderground.com/api/335bb8c77510bffb/geolookup/conditions/q/MO/St_Louis.json",
  dataType : "jsonp",
  success : function(parsed_json) {
  var location = parsed_json['location']['city'];
  var temp_f = parsed_json['current_observation']['temp_f'];
  var timeElapsed = (new Date().getTime() - timeOnLoad)/1000;
  graphData.push([timeElapsed, temp_f]);
  drawChart(graphData);
  console.log(graphData);
  var tempArray= new Uint8Array(1)
  tempArray[0] = temp_f;
  ble.write(connectingDevice.id, simpleCustomService, oledDisplayCharacteristic, tempArray.buffer, success, failure);
  }
  });

}

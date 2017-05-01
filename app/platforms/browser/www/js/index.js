/*
   *Assignment 11 javascript for Lamp App
   *Jesse Huang, Bo Huang
   * */

console.log("starting index.js")

var SCAN_TIME          = 7000;           // Scan for 7 seconds
var CONNECTION_TIMEOUT = 7000;  // Wait for 7 seconds for a valid connection

// *********   Global variables used for all IDs that are used in multiple functions
var refreshDevicesModal = null;
var connectingModal     = null;
var deviceList          = null;
var deviceObjectMap     = null;
var pageNavigator       = null;
var connectingDevice    = null;
var connectionTimeout   = null;


var simpleCustomService             = "208c9c6f-dcf8-4c1f-8a43-8f1674c21d6e";
var fanChangeCharacteristic         = "a7360086-35eb-405e-8fa9-5060fc4f60e8";
var targetTempCharacteristic        = "de356095-f965-4a5f-9418-41a48ea6718d";
var temperatureCharacteristic       = "bd4cf86c-f315-4864-9c89-8fb5d01463cf";
var rotationStrengthCharacteristic  = "11c4156d-2bbb-4c52-8dc0-722d789d8e5a";

//Data to be displayed on Google Chart
var graphData = [["Time", "Temperature"]];


// *********   Functions for scanning and scan related events
function scanFailed() {
    refreshDevicesModal.hide();
}

function scanStop() {
    ble.stopScan();
    refreshDevicesModal.hide();
}

//BLE callbacks reporting success or failure of a ble.write or ble.read
var failure = function (){
    console.log("Fail");
}
var success = function (){
    console.log("success");
}


//Commands to turn Fan on or off. Turning the Fan on triggers Manual mode
function OnFan(){
    console.log("Function ONLIGHT() called");
    var onArray= new Uint8Array(1);
    onArray[0] = 188;
    //onArray[1] = 12;
    ble.write(connectingDevice.id, simpleCustomService, fanChangeCharacteristic, onArray.buffer, success, failure);
}


//Command to turn the fan off.
function OffFan(){
    console.log("Function OFFLIGHT() called");
    var onArray= new Uint8Array(1);
    onArray[0] = 189;
    //onArray[1] = 12;
    ble.write(connectingDevice.id, simpleCustomService, fanChangeCharacteristic, onArray.buffer, success, failure);
}


//Reads the current read temperature from the smartFan, calls readTempKernel to interpret and graph the data
function readTemperature(){
  console.log("Reading temperature() called");
  ble.read(connectingDevice.id, simpleCustomService, temperatureCharacteristic, readTempKernel, failure);
}


//Get current Temperature from the daya buffer, and graph using Google Charts, drawChart() method in chart.js
function readTempKernel(buffer){
  var tempAndTime = new Uint8Array(buffer);
  var temp_read = 0;
  for(var i = 0; i < tempAndTime.length; i++){
    temp_read += tempAndTime[i];
  }
  temp_read = temp_read/10;
  var timeElapsed = (new Date().getTime() - timeOnLoad)/1000;
  if(temp_read < 10){
    temp_read += 25.5;
  }
  graphData.push([timeElapsed, temp_read]);
  drawChart(graphData);
}


//Adjust the intensity setting of the fan, and send command over to the RedBear duo.
function changeStrength(){
    var strength = parseInt(document.getElementById("strengthSelect").value);
    var onArray= new Uint8Array(1);
    onArray[0] = strength;
    //console.log(strength);
    ble.write(connectingDevice.id, simpleCustomService, rotationStrengthCharacteristic, onArray.buffer, success, failure);

}


//Change the temperature threshold for which the fan will turn on when it is in Smart Mode.
function changeTargetTemp(){
    console.log ("Target Value Changed IMPORTANT");
    var targetTemperature = document.getElementById("targetTemp").value;
    console.log(targetTemperature);
    var sendData = new Uint8Array(2);
    var onArray = targetTemperature.split(".");
    for(var i = 0; i < 2; i++){
        sendData[i] = 0;
        sendData[i] = parseInt(onArray[i]);
    }
    sendData[1] = sendData[1] *10
    ble.write(connectingDevice.id, simpleCustomService, targetTempCharacteristic, sendData.buffer, success, failure);
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
    //startTime();
    timeOnLoad = new Date().getTime();
    var plotGraph = setInterval(readTemperature,5000);
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

// *****  Preparing function for initial startup
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

//Set up page so that temperature is read every 5 seconds.
jQuery(document).ready(function($) {
  timeOnLoad = new Date().getTime();
  var plotGraph = setInterval(readTemperature,5000);
});

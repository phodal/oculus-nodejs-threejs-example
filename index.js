var hmd = require("node-hmd"),
    express = require("express"),
    http = require("http").createServer(),
    WebSocketServer = require('ws').Server,
    path = require('path');

// Create HMD manager object
console.info("Attempting to load node-hmd driver: oculusrift");
var manager = hmd.createManager("oculusrift");
if (typeof(manager) === "undefined") {
    console.error("Unable to load driver: oculusrift");
    process.exit(1);
}
// Instantiate express server
var app = express();
app.set('port', process.env.PORT || 3000);

app.use(express.static(path.join(__dirname + '/', 'public')));
app.set('views', path.join(__dirname + '/public/', 'views'));
app.set('view engine', 'jade');

app.get('/demo', function (req, res) {
    'use strict';
    res.render('demo', {
        title: 'Home'
    });
});


app.get("/", function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    res.json({quat: manager.getDeviceQuatSync(), position: manager.getDevicePositionSync()})
});

app.get("/supported", function (req, res) {
    res.json(hmd.getSupportedDevices());
});

app.get("/info", function (req, res) {
    manager.getDeviceInfo(function (err, deviceInfo) {
        res.json(deviceInfo);
    });
});

app.get("/orientation", function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    manager.getDeviceOrientation(function (err, deviceOrientation) {
        res.json(deviceOrientation);
    });
});


// Attach socket.io listener to the server
var wss = new WebSocketServer({server: http});
var id = 1;

// On socket connection set up event emitters to automatically push the HMD orientation data
wss.on("connection", function (ws) {
    function emitOrientation() {
        id = id + 1;
        var deviceQuat = manager.getDeviceQuatSync();
        var devicePosition = manager.getDevicePositionSync();

        ws.send(JSON.stringify({
            id: id,
            quat: deviceQuat,
            position: devicePosition
        }));

    }

    var orientation = setInterval(emitOrientation, 1000);

    ws.on("message", function(data) {
        clearInterval(orientation);
        orientation = setInterval(emitOrientation, data);
    });

    ws.on("disconnect", function () {
        clearInterval(orientation);
    });
});

// Launch express server
http.on('request', app);
http.listen(3000, function () {
    console.log("Express server listening on port 3000");
});

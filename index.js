var hmd = require("node-hmd"),
    express = require("express"),
    http = require("http");

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

// Launch express server
http.createServer(app).listen(3000, function () {
    console.log("Express server listening on port 3000");
});
const express = require("express");
const fs = require("fs");
const { createServer } = require("http");
const mqtt = require("mqtt");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const options = {
    port: 8883,
    protocol: "mqtts",
    key: fs.readFileSync(path.resolve("public/data/claim-private.key")),
    cert: fs.readFileSync(path.resolve("public/data/claim-cert.pem")),
    ca: fs.readFileSync(path.resolve("public/data/root-CA.crt")),
    rejectUnauthorized: true,
};

const client = mqtt.connect("mqtts://axjobfp4mqj2j-ats.iot.ap-northeast-2.amazonaws.com", options);

client.on("connect", () => {});

const app = express();
app.use(cors());
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
const server = createServer(app);
const io = new Server(server, { cors: cors() });

app.get("/", (req, res) => res.send("펫케어 mqtt 서버"));

io.on("connection", (socket) => {
    socket.on("setDeviceId", (data) => {
        const deviceId = data.deviceId;
        client.subscribe(`iot/petcarezone/topic/states/${deviceId}`, (err) => {
            if (err) {
                console.error("Subscription error:", err);
            } else {
                console.log(`Subscribed to iot/petcarezone/topic/states/${deviceId}`);
            }
        });

        client.subscribe(`iot/petcarezone/topic/events/${deviceId}`, (err) => {
            if (err) {
                console.error("Subscription error:", err);
            } else {
                console.log(`Subscribed to iot/petcarezone/topic/events/${deviceId}`);
            }
        });
    });

    client.on("message", (topic, message) => {
        console.log("Message received");
        const msg = message.toString();
        io.emit("mqttMessage", { topic, msg });
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

server.listen(3000);

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

client.on("message", (topic, message) => {
    const msg = message.toString();
    io.emit(topic, { msg });
});

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://amuzcorp-pet-care-zone-webview.vercel.app",
];

const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

app.get("/", (req, res) => res.send("펫케어 mqtt 서버"));

io.on("connection", (socket) => {
    socket.on("setDeviceId", (data) => {
        socket.emit("deviceIdSet", { success: true, deviceId: data });

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

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

server.listen(3000);

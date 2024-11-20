const { Decoder, Reader, tools } = require("ts-ebml");
const express = require("express");
const fs = require("fs");
const { createServer } = require("http");
const path = require("path");
const cors = require("cors");
const app = express();
const multer = require("multer");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

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

const upload = multer(); // 메모리 저장소 사용

app.get("/", (req, res) => res.send("펫케어 서버"));

app.post("/convert", upload.single("file"), async (req, res) => {
    try {
        const refinedBuffer = await injectMetadata(req.file.buffer);

        // 적절한 헤더 설정
        res.setHeader("Content-Disposition", "attachment; filename=processed_video.webm");
        res.setHeader("Content-Type", "video/webm");

        res.send(refinedBuffer);
    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).send("Failed to process the file.");
    }
});

const injectMetadata = async function (buffer) {
    try {
        const decoder = new Decoder();
        const reader = new Reader();
        reader.logging = false;
        reader.drop_default_duration = false;

        // EBML 데이터 디코딩
        const elms = decoder.decode(buffer);
        elms.forEach((elm) => reader.read(elm));
        reader.stop();

        // 로그 추가

        // Seekable로 메타데이터 변환
        const refinedMetadataBuf = tools.makeMetadataSeekable(
            reader.metadatas,
            reader.duration,
            reader.cues
        );

        const body = buffer.slice(reader.metadataSize || 0); // undefined 방지
        const refinedBuffer = Buffer.concat([Buffer.from(refinedMetadataBuf), body]);
        console.log("Metadata Size:", reader.metadataSize);
        console.log("Buffer Length:", buffer.length);
        console.log("Duration:", reader.duration);
        console.log("Refined Buffer Length:", refinedBuffer.length);
        return refinedBuffer;
    } catch (error) {
        console.error("Error injecting metadata:", error);
        throw error;
    }
};

server.listen(3000);

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

        // 응답을 WebM 데이터로 설정
        res.setHeader("Content-Type", "video/webm"); // 응답 콘텐츠 타입 설정
        res.send(refinedBuffer); // Buffer 전송
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
        elms.forEach((elm) => {
            reader.read(elm);
        });
        reader.stop();

        // 메타데이터 수정 (Seekable로 만들기)
        const refinedMetadataBuf = tools.makeMetadataSeekable(
            reader.metadatas,
            reader.duration, // 영상 길이
            reader.cues // 큐 데이터
        );

        const body = buffer.slice(reader.metadataSize);
        const refinedBuffer = Buffer.concat([Buffer.from(refinedMetadataBuf), body]);

        return refinedBuffer;
    } catch (error) {
        console.error("Error injecting metadata:", error);
        throw error;
    }
};

server.listen(3000);

const ebml = require("ts-ebml");

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
    const refinedBlob = await makeSeekableVideoBlobFromBlob(req.file.buffer, 5000);

    // 응답을 Blob 데이터로 설정
    res.setHeader("Content-Type", "video/webm"); // 응답 콘텐츠 타입 설정
    res.send(refinedBlob); // 수정된 Blob 데이터 전송
});

async function makeSeekableVideoBlobFromBlob(_buffer, duration) {
    const ebmlDecoder = new ebml.Decoder();
    const ebmlReader = new ebml.Reader();
    const ebmlTools = ebml.tools;

    const buffer = Buffer.from(_buffer); // 버퍼를 사용하여 파일을 처리합니다.

    ebmlReader.logging = true;
    ebmlReader.drop_default_duration = false;

    const elms = ebmlDecoder.decode(buffer);
    elms.forEach((elm) => {
        ebmlReader.read(elm);
    });
    ebmlReader.stop();

    const refinedMetadataBuf = ebmlTools.makeMetadataSeekable(
        ebmlReader.metadatas,
        duration,
        ebmlReader.cues
    );
    const body = buffer.slice(ebmlReader.metadataSize);
    const refined = Buffer.concat([Buffer.from(refinedMetadataBuf), body]);

    return refined;
}

server.listen(3000);

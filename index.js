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

const upload = multer({ dest: "uploads/" });
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

app.get("/", (req, res) => res.send("펫케어 서버"));

app.post("/convert", upload.single("file"), (req, res) => {
    const webmFilePath = req.file.path;
    const outputDir = path.join(__dirname, "converted");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputFilePath = path.join("converted", `${Date.now()}.mp4`);

    ffmpeg(webmFilePath)
        .output(outputFilePath)
        .on("end", () => {
            // 변환 완료 후 MP4 파일을 전송
            res.sendFile(outputFilePath, { root: "." }, (err) => {
                if (err) console.error("Error sending file:", err);
                // 변환된 파일과 원본 파일 삭제
                fs.unlinkSync(outputFilePath);
                fs.unlinkSync(webmFilePath);
            });
        })
        .on("error", (err) => {
            console.error("FFmpeg error:", err);
            res.status(500).send("Conversion failed");
            fs.unlinkSync(webmFilePath);
        })
        .run();
});

server.listen(3000);

import  express from 'express';
import cors from 'cors';
import  { spawn } from 'child_process';

const app = express();
app.use(cors());

// Health check
app.get('/', (req, res) => {
  res.send("🎧 YouTube Downloader Backend is Running.");
});

  app.get('/download', (req, res) => {
  const videoUrl = req.query.url;
  const format = req.query.format || 'mp3';

  if (!videoUrl) {
    return res.status(400).send("❌ Video URL is required");
  }

  const ytdlpArgs = format === 'mp3'
  ? ['--cookies', 'cookies.txt', '-x', '--audio-format', 'mp3', '-o', '-', videoUrl]
  : ['--cookies', 'cookies.txt', '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', '-o', '-', videoUrl];

  if (format === 'mp3') {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
  } else {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
  }

  const ytdlp = spawn('yt-dlp', ytdlpArgs);

  let hasError = false;

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.setEncoding('utf8');
  ytdlp.stderr.on('data', (data) => {
    console.error("YT-DLP ERROR >>>", data);
    hasError = true;
    if (!res.headersSent) {
      res.status(500).send("❌ Download failed. yt-dlp error.");
    }
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.log(`yt-dlp exited with code ${code}`);
      if (!res.headersSent && !hasError) {
        res.status(500).send("❌ yt-dlp exited with error");
      }
    }
  });

  ytdlp.on('error', (err) => {
    console.error("Failed to start yt-dlp:", err);
    if (!res.headersSent) {
      res.status(500).send("❌ Could not run yt-dlp");
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

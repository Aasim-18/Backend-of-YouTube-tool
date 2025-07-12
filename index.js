import  express from 'express';
import cors from 'cors';
import  { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/download', (req, res) => {
  const videoUrl = req.query.url;
  const format = req.query.format || 'mp4';
  const quality = req.query.quality; // optional

  if (!videoUrl) {
    return res.status(400).send('Missing YouTube video URL');
  }

  let ytDlpArgs;

  if (format === 'mp3') {
    // For MP3 audio download
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    res.setHeader('Content-Type', 'audio/mpeg');
    ytDlpArgs = [
      '-x',                      // extract audio
      '--audio-format', 'mp3',   // convert to mp3
      '-o', '-',                 // output to stdout
      videoUrl
    ];
  } else {
    // For MP4 video download
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    res.setHeader('Content-Type', 'video/mp4');

    let formatCode = 'best';
    if (quality) {
      formatCode = `bestvideo[height<=${quality}]+bestaudio/best`;
    }

    ytDlpArgs = [
      '-f', formatCode,
      '-o', '-',
      videoUrl
    ];
  }

  const ytdlp = spawn('yt-dlp', ytDlpArgs);

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on('data', (data) => {
    console.error(`yt-dlp error: ${data}`);
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.log(`yt-dlp exited with code ${code}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

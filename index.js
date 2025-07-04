const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors());

function sanitizeFilename(name) {
  return name.replace(/[\\/?%*:|"<>]/g, '');
}

app.get('/download/mp4', (req, res) => {
  const url = req.query.url;
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL or failed to download.' });
  }

  const titleProcess = spawn('yt-dlp', ['--get-title', url]);
  let title = '';
  titleProcess.stdout.on('data', data => title += data.toString());
  titleProcess.stderr.on('data', data => console.error(data.toString()));

  titleProcess.on('close', code => {
    if (code !== 0) {
      return res.status(400).json({ error: 'Invalid YouTube URL or failed to download.' });
    }

    title = sanitizeFilename(title.trim());
    res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.header('Content-Type', 'video/mp4');

    const download = spawn('yt-dlp', ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', '-o', '-', url]);
    download.stdout.pipe(res);
    download.stderr.on('data', data => console.error(data.toString()));
    download.on('close', dlCode => {
      if (dlCode !== 0 && !res.headersSent) {
        res.status(400).json({ error: 'Invalid YouTube URL or failed to download.' });
      }
    });
  });
});

app.get('/download/mp3', (req, res) => {
  const url = req.query.url;
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL or failed to download.' });
  }

  const titleProcess = spawn('yt-dlp', ['--get-title', url]);
  let title = '';
  titleProcess.stdout.on('data', data => title += data.toString());
  titleProcess.stderr.on('data', data => console.error(data.toString()));

  titleProcess.on('close', code => {
    if (code !== 0) {
      return res.status(400).json({ error: 'Invalid YouTube URL or failed to download.' });
    }

    title = sanitizeFilename(title.trim());
    res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');

    const download = spawn('yt-dlp', [
      '--no-playlist',
      '-f', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'mp3',
      '-o', '-',
      url
    ]);
    download.stdout.pipe(res);
    download.stderr.on('data', data => console.error(data.toString()));
    download.on('close', dlCode => {
      if (dlCode !== 0 && !res.headersSent) {
        res.status(400).json({ error: 'Invalid YouTube URL or failed to download.' });
      }
    });
  });
});

app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});

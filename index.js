const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());

// Update this to the full path where yt-dlp.exe is installed
const ytDlpPath = 'C:\\Users\\packr\\scoop\\persist\\python\\scripts\\yt-dlp.exe';

function sanitizeFilename(name) {
  return name.replace(/[\\/?%*:|"<>]/g, '');
}

app.get('/download/mp4', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing YouTube URL' });

  const titleProcess = spawn(ytDlpPath, ['--get-title', url]);
  let title = '';

  titleProcess.stdout.on('data', data => {
    title += data.toString();
  });

  titleProcess.stderr.on('data', data => {
    console.error(`yt-dlp title error: ${data.toString()}`);
  });

  titleProcess.on('close', code => {
    if (code !== 0) {
      return res.status(400).json({ error: 'Failed to get video title' });
    }

    title = sanitizeFilename(title.trim());
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const download = spawn(ytDlpPath, [
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
      '-o', '-',
      url
    ]);

    download.stdout.pipe(res);
    download.stderr.on('data', data => console.error(`yt-dlp download error: ${data.toString()}`));
    download.on('close', code => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Failed to download video' });
      }
    });
  });
});

app.get('/download/mp3', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing YouTube URL' });

  const titleProcess = spawn(ytDlpPath, ['--get-title', url]);
  let title = '';

  titleProcess.stdout.on('data', data => {
    title += data.toString();
  });

  titleProcess.stderr.on('data', data => {
    console.error(`yt-dlp title error: ${data.toString()}`);
  });

  titleProcess.on('close', code => {
    if (code !== 0) {
      return res.status(400).json({ error: 'Failed to get audio title' });
    }

    title = sanitizeFilename(title.trim());
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const download = spawn(ytDlpPath, [
      '--no-playlist',
      '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '-o', '-',
      url
    ]);

    download.stdout.pipe(res);
    download.stderr.on('data', data => console.error(`yt-dlp download error: ${data.toString()}`));
    download.on('close', code => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Failed to download audio' });
      }
    });
  });
});

app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});

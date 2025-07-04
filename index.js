const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
app.use(cors());

// Use absolute path to yt-dlp.exe
const ytDlpPath = 'C:\\Users\\packr\\scoop\\persist\\python\\scripts\\yt-dlp.exe';

// Optional flags to help with region locks and IPv6
const commonYtDlpArgs = ['--geo-bypass', '--force-ipv4'];

const PORT = process.env.PORT || 3000;

function sanitizeFilename(name) {
  return name.replace(/[\\/?%*:|"<>]/g, '');
}

app.get('/download/mp4', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing YouTube URL' });

  const titleProcess = spawn(ytDlpPath, [...commonYtDlpArgs, '--get-title', url]);
  let title = '';
  let titleErr = '';

  titleProcess.stdout.on('data', data => title += data.toString());
  titleProcess.stderr.on('data', data => titleErr += data.toString());

  titleProcess.on('error', err => {
    console.error('yt-dlp spawn error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });

  titleProcess.on('close', code => {
    if (code !== 0) {
      return res.status(400).json({ error: titleErr.trim() || 'Failed to get video title' });
    }

    title = sanitizeFilename(title.trim());
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const download = spawn(ytDlpPath, [
      ...commonYtDlpArgs,
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
      '-o', '-',
      url
    ]);

    let downloadErr = '';
    download.stderr.on('data', data => downloadErr += data.toString());
    download.on('error', err => {
      console.error('yt-dlp spawn error:', err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });

    download.stdout.pipe(res);

    download.on('close', code => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: downloadErr.trim() || 'Failed to download video' });
      }
    });
  });
});

app.get('/download/mp3', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing YouTube URL' });

  const titleProcess = spawn(ytDlpPath, [...commonYtDlpArgs, '--get-title', url]);
  let title = '';
  let titleErr = '';

  titleProcess.stdout.on('data', data => title += data.toString());
  titleProcess.stderr.on('data', data => titleErr += data.toString());

  titleProcess.on('error', err => {
    console.error('yt-dlp spawn error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });

  titleProcess.on('close', code => {
    if (code !== 0) {
      return res.status(400).json({ error: titleErr.trim() || 'Failed to get audio title' });
    }

    title = sanitizeFilename(title.trim());
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const download = spawn(ytDlpPath, [
      ...commonYtDlpArgs,
      '--no-playlist',
      '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '-o', '-',
      url
    ]);

    let downloadErr = '';
    download.stderr.on('data', data => downloadErr += data.toString());
    download.on('error', err => {
      console.error('yt-dlp spawn error:', err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });

    download.stdout.pipe(res);

    download.on('close', code => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: downloadErr.trim() || 'Failed to download audio' });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
app.use(cors());

app.get('/download/mp4', (req, res) => {
  const url = req.query.url;
  if (!ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

  res.header('Content-Disposition', 'attachment; filename="video.mp4"');
  ytdl(url, { quality: 'highestvideo' }).pipe(res);
});

app.get('/download/mp3', (req, res) => {
  const url = req.query.url;
  if (!ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

  const stream = ytdl(url, { quality: 'highestaudio' });

  res.header('Content-Disposition', 'attachment; filename="audio.mp3"');

  ffmpeg(stream)
    .audioBitrate(128)
    .toFormat('mp3')
    .on('error', err => {
      console.error('FFmpeg error:', err);
      res.sendStatus(500);
    })
    .pipe(res, { end: true });
});

app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});

const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = process.env.PORT || 3000;

app.get('/download/mp3', async (req, res) => {
  const url = req.query.url;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send('Invalid or missing URL');
  }
  res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
  const stream = ytdl(url, { quality: 'highestaudio' });
  ffmpeg(stream)
    .audioBitrate(128)
    .format('mp3')
    .on('error', err => {
      console.error('ffmpeg error:', err);
      res.status(500).send('Conversion error');
    })
    .pipe(res, { end: true });
});

app.get('/download/mp4', async (req, res) => {
  const url = req.query.url;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send('Invalid or missing URL');
  }
  res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
  ytdl(url, { quality: 'highestvideo', filter: 'audioandvideo' }).pipe(res);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

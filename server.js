const express = require('express');
const app = express();
const multer = require('multer');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
app.use(express.urlencoded({ extended: true }));

const PORT = 3001;

const MONGO_URI = 'mongodb://localhost:27017/node-task'

global.gfs;


const { GridFsStorage } = require('multer-gridfs-storage');

const storage = new GridFsStorage({
  url: MONGO_URI,
  file: (req, file) => {
    return {
      filename: req.body.myInput + '_' + Date.now()
    };
  }
});
const upload = multer({ storage });

app.get('/download/:filename', (req, res, next) => {
  const fileId = mongoose.Types.ObjectId(req.params.filename);
  gfs.files.find({ _id: fileId }).toArray(function (err, files) {
    if (err)
      return res.status(400).json('File Not Found');
    if (files.length > 0) {
      res.set('Content-Type', files[0].contentType);
      res.set('Content-Disposition', "inline; filename=" + files[0].filename);
      const read_stream = gfs.createReadStream({ _id: fileId });
      read_stream.pipe(res);
    } else {
      res.status(400).json('File Not Found');
    }
  });
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400;
    return next(error);
  }
  res.render('response', { fileId: `/download/${file.id.toString()}`, fileName: file.filename });
});

const conn = mongoose.createConnection(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

conn.once('open', function () {
  global.gfs = Grid(conn.db, mongoose.mongo);

  app.set('view engine', 'ejs');

  app.listen(PORT, function () {
    console.log(`Server started at ${PORT} port`)
  })
});

conn.on('error', function (e) {
  console.error(e);
});

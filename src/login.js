const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
  res.send('hello');
  console.log('app', req.body);
});

const port = 8080;
app.listen(port, () => {
  console.log('listening port:', port);
});

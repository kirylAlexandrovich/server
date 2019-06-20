const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const server = require('http').createServer();
const io = require('socket.io')(server);

mongoose.connect('mongodb://localhost/messDB', { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('db connected');
});

const userSchema = new mongoose.Schema({
  name: String,
  lastName: String,
  email: String,
  password: String
})
const User = mongoose.model('user', userSchema);

const app = express();
const port = 8080;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  // console.log(req.body);
  User.findOne({ email: req.body.email }, (err, data) => {
    // console.log(err, data)
    if (!data) {
      res.send('no such client');
      return;
    }
    res.send(data);
  })
});

app.listen(port, () => {
  console.log('listening port:', port);
});

// const userSchema = new mongoose.Schema({
//   name: String,
//   lastName: String,
//   email: String,
//   password: String
// })
// const User = mongoose.model('user', userSchema);

//                                                                                                           crating new USER:
// const user1 = new User({name: 'Bread', lastName: 'White', email: 'asd@gmail.com', password: '12345'});
// user1.save((err, data) => {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   console.log(data, 'data');
// })

//                                                                      SOCKET
const clientsEmails = [];

User.find({}, (err, users) => {
  if (err) return console.log(err);
  users.forEach((element) => {
    // console.log(element.email)
    clientsEmails.push(element.email);
  });
});

// console.log('aaaaaaaaaaaaaaaaaaaaa', findAllUsersEmail());
server.listen(8000);

io.on('connection', (client) => {
  let name;
  client.emit('connected', clientsEmails);
  client.on('saveClient', (nickname) => {
    if (nickname === false) {
      return;
    }
    client.name = nickname;
    console.log('client NICKNAME', client.name)
    
    // db.clients[nickname] = client.id;
    // io.emit('changeClientsList', listOfUsers);
    // console.log(findAllUsersEmail(), 'qwertyuioplkjhgfdsa');
  })

  client.broadcast.emit('changeClientsList', clientsEmails);

  console.log('Socket connected');

  client.on('message', function (data) {
    // db.messages.push(data);
    console.log(name, 'sended message');
    const message = {
      name: client.name,
      mess: data.mess,
      time: data.time,
    }
    client.broadcast.emit('message', message);
  })

  client.on('disconnect', (reason) => {
    console.log(reason, name);
    if (reason === 'io server disconnect') {
      client.connect();
    }
  })
})

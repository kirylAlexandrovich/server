const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const server = require('http').createServer();
const io = require('socket.io')(server);
const userSchema = require('./user-schema');
const messageSchema = require('./message-schema');
const roomsSchema= require('./room-schema');

mongoose.connect('mongodb://localhost/messDB', { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('db connected');
});

const User = mongoose.model('user', userSchema);

const Message = mongoose.model('message', messageSchema);

const Room = mongoose.model('room', roomsSchema);

const app = express();
const port = 8080;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  User.findOne({ email: req.body.email }, (err, data) => {
    if (!data) {
      res.send('no such client');
      return;
    }
    res.send(data);
  })
});

app.get('/rooms', (req, res) => {
  let clientEmail;
  if (req.url.search(/[^=]\w*[.]*\w+@.+/) !== -1) {
    clientEmail = req.url.match(/[^=]\w*[.]*\w+@.+/)[0];
  }
  console.log(clientEmail, 'client email get rooms');
  const roomsArr = [];
  Room.find({}, (err, data) => {
    data.forEach((el) => {
      if (el.members.includes(clientEmail)) {
        roomsArr.push(el.name);
      }
    });
    res.send(roomsArr);
  });
});

app.post('/create_room', (req, res) => {
  console.log('create room ');
  Room.findOne({ name: req.body.roomName }, (err, data) => {
    if (err) { console.log(err); return }
    if (!data) {
      const room = new Room({ name: req.body.roomName, creator: req.body.email, members: [...req.body.addingPeople, req.body.email] });
      room.save();
      res.send({ isCreated: true });
    } else {
      res.send({ isCreated: false });
    }
  });
});

app.post('/join_to_room', (req, res) => {
  // console.log(client.roomName, req.body.roomName, '-------------');
  let messageArr = [];
  Message.find({roomName: req.body.roomName}, (err, data) => {
    if (err) { console.log(err); return }
    messageArr = [...messageArr, data];
  }).then(() => {
    res.send(messageArr);
  }).catch((err) => {
    console.log(err);
  })
})

app.listen(port, () => {
  console.log('listening port:', port);
});
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
    clientsEmails.push(element.email);
  });
}).catch((err) => (err));

server.listen(8000);

io.on('connection', (client) => {
  client.emit('connected', clientsEmails);
  client.on('saveClient', (nickname) => {
    if (nickname === false) {
      return;
    }
    client.name = nickname;
    console.log('client email', [client.name])
  })
  client.broadcast.emit('changeClientsList', clientsEmails);

  client.roomName = 'general';
  client.join(client.roomName);

  client.on('message', function (data) {
    const message = {
      email: data.email,
      mess: data.mess,
      time: data.time,
      roomName: data.roomName
    }
    const saveMessage = new Message(message);
    saveMessage.save((err) => {if (err) console.log(err);})
    client.broadcast.to(data.roomName).emit('message', message);
  })
  
  client.on('change_room', function (data) {
    console.log(data);
    client.leave(data.currentRoom);
    client.join(data.stateRoom);
  })

  client.on('disconnect', (reason) => {
    console.log(reason, client.name);
    if (reason === 'io server disconnect') {
      client.connect();
    }
  })
})

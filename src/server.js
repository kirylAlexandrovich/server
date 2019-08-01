const userSchema = require('./user-schema');
const messageSchema = require('./message-schema');
const roomsSchema = require('./room-schema');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const server = require('http').createServer();
const io = require('socket.io')(server);

mongoose.connect('mongodb://mongodb:27017/messDB', { useNewUrlParser: true });
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
    if (err) { console.log(err) }
    if (!data) {
      console.log('no client', data);
      res.send('no_such_client');
      return;
    }
    if (data.password !== req.body.password) {
      res.send('wrong_password');
      return;
    }
    console.log(data.email, 'client login');
    res.send(data);
  });
});

app.get('/rooms', (req, res) => {
  let clientEmail;
  if (req.url.search(/[^=]\w*[.]*\w+@.+/) !== -1) {
    clientEmail = req.url.match(/[^=]\w*[.]*\w+@.+/)[0];
  }
  const roomsArr = [];
  const privateRoomsArr = [];
  console.log('client', clientEmail, 'get rooms');
  Room.find({}, (err, data) => {
    data.forEach((el) => {
      if (el.members.includes(clientEmail) && !el.privateRoom) {
        roomsArr.push(el.name);
      } else if (el.members.includes(clientEmail) && el.privateRoom) {
        privateRoomsArr.push(el);
      }
    });
    res.send({ roomsArr, privateRoomsArr }); 
  });
});

app.get('/clients_list', (req, res) => {
  const clientsEmails = [];
  console.log('get clients list');
  User.find({}, (err, users) => {
    if (err) return console.log(err);
    users.forEach((element) => {
      clientsEmails.push(element.email);
    });
  }).then(() => {
    res.send(clientsEmails);
  })
    .catch((err) => (err));
});

app.post('/create_room', (req, res) => {
  console.log('creating room', [req.body.roomName, req.body.addingPeople, req.body.email, req.body.privateRoom]);
  Room.findOne({ name: req.body.roomName }, (err, data) => {
    if (err) { console.log(err); return }
    if (!data) {
      const room = new Room({ name: req.body.roomName, creator: req.body.email, members: [...req.body.addingPeople, req.body.email], privateRoom: req.body.privateRoom });
      room.save((err, room) => {
        res.send({ isCreated: true, roomName: room.roomName });
      });
    } else {
      console.log(['not created']);
      res.send({ isCreated: false });
    }
  });
});

app.post('/get_room_messages', (req, res) => {
  console.log('joining room', req.body.roomName);
  Message.find({ roomName: req.body.roomName }, (err, data) => {
    if (err) { console.log(err); return }
    res.send(data);
  })
});

// app.post('/get_messages', (req, res) => {
//   let roomMessagesMap = {};
//   req.body.roomsNames.forEach((roomName, index) => {
//     Message.find({ roomName: roomName }, (err, data) => {
//       if (err) { console.log(err); return }
//       roomMessagesMap[roomName] = data;
//     }).then(() => {
//       if (index === roomsNames.length - 1) {
//         res.send(roomMessagesMap);
//       }
//     });
//   });
// });

app.post('/register_user', (req, res) => {
  const { details } = req.body;
  console.log(details);
  User.findOne({ email: details.email }, (err, data) => {
    if (data) {
      res.send({ error: 'This email is already registered' });
      return;
    }
    const user1 = new User({ name: details.firstName, lastName: details.lastName, email: details.email, password: details.cryptoPassword });
    user1.save((err) => {
      if (err) { console.log(err); }
    });
    res.send(true);
  });
});

app.listen(port, () => {
  console.log('listening port:', port);
});

//                                                                      SOCKET.IO

server.listen(8000);

io.on('connection', (client) => {
  client.emit('connected');
  client.on('saveClient', (nickname) => {
    if (nickname === false) {
      return;
    }
    client.name = nickname;
    console.log('client email', [client.name])
  })
  client.broadcast.emit('changeClientsList');

  client.roomName = 'general';
  client.join(client.roomName);

  client.on('message', function (data) {
    console.log(data);
    const { email, mess, time, roomName } = data;
    const saveMessage = new Message({ email, mess, time, roomName });
    saveMessage.save((err) => { if (err) console.log(err); })
    client.broadcast.to(data.roomName).emit('message', { email, mess, time, roomName });
  });

  client.on('joinToRooms', (roomsList) => {
    roomsList.forEach((room) => {
      client.join(room);
    });
  });

  client.on('disconnect', (reason) => {
    console.log(reason, client.name);
    if (reason === 'io server disconnect') {
      client.connect();
    }
  });
})

const userSchema = require('./user-schema');
const messageSchema = require('./message-schema');
const roomsSchema = require('./room-schema');
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
  console.log(clientEmail, 'client get rooms');
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

app.get('/clients_list', (req, res) => {
  const clientsEmails = [];
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

app.post('/select_interlocutor', (req, res) => {
  User.find({ email: {$in: [req.body.email, req.body.interloc]}}, (err, data) => {
    if (err) { console.log(err); return }
    console.log(data[1]._id > data[0]._id);
  })

  // Room.findOne({ name: req.body.roomName }, (err, data) => {
  //   if (err) { console.log(err); return }
  //   if (!data) {
  //     const room = new Room({ name: req.body.roomName, creator: req.body.email, members: [...req.body.addingPeople, req.body.email] });
  //     room.save();
  //     res.send({ isCreated: true });
  //   } else {
  //     res.send({ isCreated: false });
  //   }
  // });
});

app.post('/create_room', (req, res) => {
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
  Message.find({ roomName: req.body.roomName }, (err, data) => {
    if (err) { console.log(err); return }
    res.send(data);
  })
});

app.post('/register_user', (req, res) => {
  const { details } = req.body;
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
    const message = {
      email: data.email,
      mess: data.mess,
      time: data.time,
      roomName: data.roomName
    }
    const saveMessage = new Message(message);
    saveMessage.save((err) => { if (err) console.log(err); })
    client.broadcast.to(data.roomName).emit('message', message);
  })

  client.on('change_room', function (data) {
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

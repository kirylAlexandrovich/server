// const WebSocket = require('ws');
const Db = require('./db');
const db = new Db();

const server = require('http').createServer();

const io = require('socket.io')(server);

io.on('connection', (client) => {
  db.clients[client.id] = client;

  client.send('message from server')

    client.on('message', function incoming(data) {

      let stringData = data.toString();
      if (stringData[0] === '#') {
        if (!db.keys[stringData.match(/#[a-z]+/i)]) {
          db.clients[client.remotePort].send('Invalid command, list of commands:\n' + Object.keys(db.keys).join(',\n'));
          return false;
        } else {
          db.keys[stringData.match(/#[a-z]+/i)](stringData.trim(), client);
        }
        return true;
      } else if (db.chatRooms.length > 1) {
        let indexRoom;
        db.chatRooms.find((el, index) => {
          if (el[client.remotePort]) {
            indexRoom = Object.keys(db.chatRooms[index]);
            return true;
          }
        });
        indexRoom.forEach(element => {
          if (element != client.remotePort) {
            db.clients[element].send(client + ': ' + stringData);
          }
        });
      } else {
        client.send('Choose your interlocutor:\n' + Object.keys(db.clients));
      }
    });
});

io.listen(8000);

// const wss = new WebSocket.Server({ port: 8080 });

// wss.on('connection', function connection(ws) {
//   console.log('Connected');
//   ws.on('message', function incoming(data) {
//     let stringData = data.toString();
//     if (stringData[0] === '#') {
//       if (!db.keys[stringData.match(/#[a-z]+/i)]) {
//         db.clients[ws.remotePort].send('Invalid command, list of commands:\n' + Object.keys(db.keys).join(',\n'));
//         return false;
//       } else {
//         db.keys[stringData.match(/#[a-z]+/i)](stringData.trim(), ws.remotePort);
//       }
//       return true;
//     } else if (db.chatRooms.length > 1) {
//       let indexRoom;
//       db.chatRooms.find((el, index) => {
//         if (el[ws.remotePort]) {
//           indexRoom = Object.keys(db.chatRooms[index]);
//           return true;
//         }
//       });
//       indexRoom.forEach(element => {
//         if (element != ws.remotePort) {
//           db.clients[element].send(ws.remotePort + ': ' + stringData);
//         }
//       });
//     } else {
//       ws.send('Choose your interlocutor:\n' + Object.keys(db.clients));
//     }
//   });


// ws.send('something');
// });
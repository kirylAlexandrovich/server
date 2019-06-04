class Db {
    constructor() {
        this.chatRooms = [0];
        this.clients = {};
        this.keys = {
        '#end': (str, client) => {
            // client.destroy();
            // delete this.clients[client];
            console.log('Сlose connection ' + client); 
        },
        '#createChat': (client_2, creator) => {
            const interlocutor = client_2.match(/[0-9]{5}/)[0];
            console.log(interlocutor);
            if (client_2.search(/[0-9]{5}/) !== -1) {
                let status = 1;
                this.chatRooms.find((el) => {
                    if (el[creator]) {
                        this.clients[creator].write('You already have a chat. Leave it before creating a new one.');
                        status = 0;
                    } else if (el[interlocutor]) {
                        this.clients[creator].write('Your interlocutor is bysy choose another one');
                        status = 0;
                    }
                });
                if (status === 1) {
                    let obj = {};
                    obj[creator] = 'creator';
                    obj[interlocutor] = 'interlocutor';
                    if (this.clients[interlocutor]) {
                        this.clients[interlocutor].write('You have been added to chat: ' + this.chatRooms.length);
                        this.chatRooms.push(obj);
                    } else {
                        this.clients[creator].write(interlocutor + ' invalid address,\nlist of addresses:\n' + Object.keys(this.clients));
                    }
                }
            } else {
                this.clients[creator].write('Wrong address');
            }
            console.log(this.chatRooms);
        },
        '#addToChat': (str, client) => {
            let roomNumber;
            this.chatRooms.find((el, index) => {
                if (el[client]) {
                    roomNumber = index;
                }
            });
    
            if (typeof roomNumber !== 'number') {
                this.clients[client].write(roomNumber + ', you must create a room before adding a buddy.');
                return;
            }
    
            if (str.search(/[0-9]{5}/) === -1) {
                this.clients[client].write('Incorrect port');
                return;
            }
            let human = str.match(/[0-9]{5}/)[0];
            if (!this.clients[human]) {
                this.clients[client].write(human + " client doesn't exist");
                return;
            }
            this.chatRooms[roomNumber][human] = 'interlocutor';
            this.clients[client].write(human + ' added to chat ' + roomNumber);
            this.clients[human].write('You have been added to chat' + roomNumber);
            console.log(this.chatRooms);
        },
        "#leaveChat": (str, client) => {
            this.chatRooms.find((el, index) => {
                if (el[client]) {
                    delete this.chatRooms[index][client];
                }
                if (Object.keys(this.chatRooms[index]).length === 0 && typeof this.chatRooms[index] === 'object') {
                    this.chatRooms.splice(index, 1);
                }
                console.log(this.chatRooms);
            });
        },
        '#list': (str, client) => {
            this.clients[client].send('List of users:\n' + Object.keys(this.clients));
        }
    };
}
}

module.exports = Db;
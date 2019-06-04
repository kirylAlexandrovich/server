/* eslint-disable no-undef */
const net = require('net');

const client = new net.Socket();
client.connect(1337, () => {
    console.log('Connected');
});

process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
    let chunk;
    
    while ((chunk = process.stdin.read()) !== null) {
        client.write(chunk, client);   
    }
});

client.on('data', (data) => {
    let stringData = data.toString().trim();
    if (stringData.search(/#@[0-9]{5}/) !== -1) {
        console.log('Your port is: ' + stringData.match(/[0-9]{5}/));
        return;
    } 
    console.log(stringData);
});

client.on('close', () => {
    process.exit();
    console.log('Connection closed');
});

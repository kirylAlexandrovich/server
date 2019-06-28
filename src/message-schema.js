const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    email: String,
    mess: String,
    time: String,
    recipient: String,
    roomName: String
});

module.exports = messageSchema;
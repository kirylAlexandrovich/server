const mongoose = require('mongoose');

const roomsSchema = new mongoose.Schema({
    name: String,
    creator: String,
    members: Array,
});

module.exports = roomsSchema;
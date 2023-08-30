const mongoose = require('mongoose');

const User = mongoose.model('User',new mongoose.Schema({
    telegram_chat_id: Number,
    telegram_username: {type: String, default: null},
    first_name: {type: String, default: null},
    last_name: {type: String, default: null},
    level: {type: String, default: null},
    accounts_purchased: {type: Number, default: 0},
    role: {type: String, default: "user"},
    creation_date: String,
}));


module.exports = {
    User
};
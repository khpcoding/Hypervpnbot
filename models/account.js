const mongoose = require('mongoose');

const Account = mongoose.model('account',new mongoose.Schema({
    telegram_chat_id: Number,
    telegram_username: {type: String, default: null},
    screenshot_file_id: {type: String, default: null},
    config: String,
    plan: String,
    operator: String,
    creation_date: String,
}));


module.exports = {
    Account
};
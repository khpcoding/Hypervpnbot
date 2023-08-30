const mongoose = require('mongoose');

const Req = mongoose.model('req',new mongoose.Schema({
    telegram_chat_id: Number,
    telegram_username: {type: String, default: null},
    ref_id: {type: Number, default: null},
    screenshot: {type: Boolean, default: false},
    screenshot_file_id: {type: String, default: null},
    caption: {type: String, default: null},
    approved: Boolean,
    checked: Boolean,
    type: String,
    renewal_account: {type: String, default: null},
    creation_date: String,
    operator: {type: String, default: null},
    status: String,
    plan: {type: String, default: null},
    config: {type: String, default: null}
}));


module.exports = {
    Req
};
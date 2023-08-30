// ========== Packages required ==========
process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
const config = require('config');
const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');

// ========== Modules ==========
const levels = require("./modules/levels");

// ========== Database Models ===========
const users = require('./models/user');
const reqs = require('./models/req');
const generalConfigs = require('./models/config');
const accountModel = require('./models/account');

// ******************************
// ========== Telegraf ========== 
const bot = new Telegraf(config.get('bot_token'));

// Bot message handler
bot.on('message', (ctx) => {
    ctx.telegram.getChatMember(config.get("sponsor_channel"),ctx.chat.id).then((chatMember) => {
        if(chatMember.status === "left" || chatMember.status === "kicked"){
            ctx.reply(levels.general.responses.notsub);
            return;
        }
        // DB Connection
        mongoose.set('strictQuery', true);
        let connectionString = `mongodb://${config.get('db.user')}:${config.get('db.pass')}@${config.get('db.host')}/${config.get('db.db_name')}?authSource=admin`;
        // let connectionString = "mongodb://localhost:27017/vpnbotdb";
        mongoose.connect(connectionString,{ useNewUrlParser: true,useUnifiedTopology: true })
        .then(async () => {
            let message = ctx.message.text;
            let generals = await generalConfigs.Config.findOne({});
            
            
            // Check if admin
            let isAdmin = false;
            let userObj = await users.User.findOne({telegram_chat_id: ctx.chat.id}).exec();
            if (userObj && userObj.role === "admin") isAdmin = true;
            
            if(!userObj){
                let newUser = new users.User({
                    telegram_chat_id: ctx.chat.id,
                    telegram_username: ctx.chat.username ? ctx.chat.username : null,
                    first_name: ctx.chat.first_name ? ctx.chat.first_name : null,
                    last_name: ctx.chat.last_name ? ctx.chat.last_name : null,
                    level: "home",
                    accounts_purchased: 0,
                    creation_date: (new Date()).toLocaleDateString()
                });
                userObj = await newUser.save();
            }
            
            
            // Start handler and inserting new users
            if(message == '/start' || message == 'start'){
                if(await reqs.Req.deleteMany({telegram_chat_id: ctx.chat.id, status: "temp"}).exec()){
                    ctx.reply(levels.general.responses.subscription,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                }
            }
            
            
            // *****************************************
            // ========== User input handler ===========
            // *****************************************
            switch(message){
                case levels.home.buttons.purchase: 
                    if(!generals.service_active){
                        ctx.reply(levels.purchase.responses.notActive);
                        break;
                    }
                    else{
                        if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'purchase_1'}})) {
                            if(generals){
                                ctx.reply(generals.service_description,Markup.keyboard(levels.purchase.getKeyboardOperatorLayout()).oneTime().resize());
                            }
                        }
                        else{ throw("") }
                        break;
                    }
                
                case levels.home.buttons.tutorials:
                    ctx.reply(levels.general.responses.tutorials,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                    break;
                
                case levels.home.buttons.troubleshoot:
                    if(generals.service_troubleshoot_active){
                        ctx.reply(levels.general.responses.troubleshoot,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                        break;
                    }
                    ctx.reply(generals.troubleshoot_message,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                    break;

                case levels.home.buttons.disconnected:
                    ctx.reply(generals.disconnected_text,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                    break;

                case levels.home.buttons.lowspeed:
                    ctx.reply(generals.lowspeed_text,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                    break;

                case levels.home.buttons.rules:
                    ctx.reply(generals.rules,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                    break;
                
                case levels.home.buttons.checkReq:
                    let userReqs = await reqs.Req.find({telegram_chat_id: ctx.chat.id}).exec();
                    if(userReqs){
                        if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'user_reqs'}})){
                            ctx.reply(levels.reqs.responses.list,Markup.keyboard(levels.reqs.getKeyboardLayout(userReqs)).oneTime().resize());
                        }
                        else{
                            throw("");
                        }
                    }
                    else{
                        if(userReqs.length === 0){
                            ctx.reply(levels.reqs.responses.noEntity,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                        }
                    }
                    break;
                    
                case levels.general.buttons.back:
                    if(await reqs.Req.deleteMany({telegram_chat_id: ctx.chat.id, status: "temp"}).exec()){
                        ctx.reply(levels.general.responses.subscription,Markup.keyboard(levels.home.getKeyboardLayout(isAdmin)).oneTime().resize());
                    }
                    break;
                    
                    
                default:
                    if(Object.values(levels.purchase.buttons.operators).includes(message)){
                        if(!generals.service_active){
                            ctx.reply(levels.purchase.responses.notActive);
                            break;
                        }
                        else{
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'purchase_2'}})) {
                                if(await new reqs.Req({
                                    telegram_chat_id: ctx.chat.id,
                                    telegram_username: ctx.chat.username,
                                    approved: false,
                                    checked: false,
                                    type: "purchase",
                                    creation_date: new Date().toLocaleDateString(),
                                    status: "temp",
                                    operator: message
                                }).save()){
                                    ctx.reply(levels.plans.responses.menu,Markup.keyboard(levels.plans.getKeyboardLayout()).oneTime().resize());
                                    // ctx.reply(levels.purchase.responses.payment,Markup.keyboard([[levels.general.buttons.back]]).oneTime().resize());
                                    // ctx.reply(generals.payment_description);
                                }
                                else{
                                    throw("متاسفانه خطایی اتفاق افتاد. جهت بررسی و دریافت اکانت به آیدی پشتیبانی پیام دهید");
                                }
                            }
                            else{ throw("") }
                            break;
                        }
                    }
                    else{
                        let userObj = await users.User.findOne({telegram_chat_id: ctx.chat.id}).exec();
                        if(userObj){
                            if(userObj.level.includes('add-config') && message !== levels.home.buttons.admin){
                                let id = userObj.level.split('-')[2];
                                reqs.Req.updateOne({_id: id},{"$set":{config: message}}).exec().then(()=>{
                                    userObj.level = "admin-screenshot";
                                    if(userObj.save()){
                                        ctx.reply(levels.admin.responses.configAdded);
                                        return;
                                    }
                                }).catch(e=>{
                                    throw(e);
                                });
                                return;
                            }
                            if(userObj.level === "purchase_2" && message !== levels.home.buttons.admin){
                                if(!generals.service_active){
                                    ctx.reply(levels.purchase.responses.notActive);
                                    break;
                                }
                                else{
                                    if(!Object.values(levels.plans.buttons).includes(message)){ break; }
                                    if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'purchase_3'}})) {
                                        let curReq = await reqs.Req.findOne({telegram_chat_id: ctx.chat.id,status: "temp"}).exec();
                                        curReq.plan = message;
                                        if(await curReq.save()){
                                            ctx.reply(generals.payment_description,Markup.keyboard([[levels.general.buttons.back]]).oneTime().resize());
                                        }
                                        else{
                                            throw("متاسفانه خطایی اتفاق افتاد. جهت بررسی و دریافت اکانت به آیدی پشتیبانی پیام دهید");
                                        }
                                    }
                                    else{ throw("") }
                                    break;
                                }
                            }
                            if(userObj.level === "purchase_3" && message !== levels.home.buttons.admin){
                                if(ctx.message.photo){
                                    let photoFileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
                                    let caption = ctx.message.caption ? ctx.message.caption : null;
                                    let curReq = await reqs.Req.findOne({telegram_chat_id: ctx.chat.id,status: "temp"}).exec();
                                    curReq.screenshot = true;
                                    curReq.screenshot_file_id = photoFileId;
                                    curReq.status = "complete";
                                    curReq.caption = caption;
                                    if(await curReq.save()){
                                        ctx.reply(levels.purchase.responses.success,Markup.keyboard(
                                        [
                                            [levels.general.buttons.back]
                                        ]).oneTime().resize());
                                    }
                                    else{
                                        throw("متاسفانه خطایی در ثبت تصویر اتفاق افتاد. جهت بررسی و دریافت اکانت به آیدی پشتیبانی پیام دهید");
                                    }
                                }
                                else{
                                    throw("لطفا اسکرین شات پرداخت خود را ارسال کنید");
                                }
                            }
                            
                            else if(userObj.level === "user_reqs" && message !== levels.home.buttons.admin){
                                let userRefId = (message.split("|")[0]).split(":")[1].trim();
                                let cond = {};
                                if(message.split("|")[0].split(":")[0].trim() !== "تصویر ارسالی"){
                                    cond = {ref_id: Number(userRefId)};
                                }
                                else{
                                    cond = {_id: mongoose.Types.ObjectId(userRefId)};
                                }
                                let userReq = await reqs.Req.findOne(cond).exec();
                                if(userReq){
                                    if(!userReq.checked){
                                        ctx.reply(levels.reqs.responses.waiting);
                                    }
                                    else{
                                        if(userReq.approved){
                                            cond = userReq.screenshot ? {screenshot_file_id: userReq.screenshot_file_id} : {ref_id: userRefId};
                                            let account = await accountModel.Account.findOne(cond);
                                            if(account){
                                                ctx.telegram.sendMessage(account.telegram_chat_id,levels.purchase.decorateAccount({id: account._id,config: account.config}),{
                                                    parse_mode: "HTML"
                                                });
                                            }
                                            else{
                                                throw("اکانت پیدا نشد");
                                            }
                                        }
                                        else{
                                            ctx.telegram.sendMessage(userReq.telegram_chat_id,levels.purchase.responses.rejectedPayment + "\n\nشماره رهگیری پرداخت: " + userRefId);
                                        }
                                    }
                                }
                                else{
                                    throw("خطایی در دریافت درخواست به وجود آمد")
                                }
                            }
                            
                            // *********************************************
                            // ========== Admin Default Messages ===========
                            // *********************************************
        
                            // Changing service description by admin
                            else if(userObj.level === "changing-service-description"){
                                if(await generalConfigs.Config.updateOne({},{"$set":{service_description: message}})){
                                    ctx.reply(levels.admin.responses.success);
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                        }
                                    });
                                }
                                else{
                                    throw("");
                                }
                            }
                            
                            
                            // Changing payment description by admin
                            else if(userObj.level === "changing-payment-description"){
                                if(await generalConfigs.Config.updateOne({},{"$set":{payment_description: message}})){
                                    ctx.reply(levels.admin.responses.success);
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                        }
                                    });
                                }
                                else{
                                    throw("");
                                }
                                await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}});
                            }
                            
                            
                            // Changing troubleshooting message by admin 
                            else if(userObj.level === "changing-troubleshoot-message"){
                                if(await generalConfigs.Config.updateOne({},{"$set":{troubleshoot_message: message}})){
                                    ctx.reply(levels.admin.responses.success);
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                        }
                                    });
                                }
                                else{
                                    throw("");
                                }
                                await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}});
                            }

                            // Changing disconnected message by admin 
                            else if(userObj.level === "changing-disconnected-message"){
                                if(await generalConfigs.Config.updateOne({},{"$set":{disconnected_text: message}})){
                                    ctx.reply(levels.admin.responses.success);
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                        }
                                    });
                                }
                                else{
                                    throw("");
                                }
                                await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}});
                            }

                            // Changing low speed message by admin 
                            else if(userObj.level === "changing-lowspeed-message"){
                                if(await generalConfigs.Config.updateOne({},{"$set":{lowspeed_text: message}})){
                                    ctx.reply(levels.admin.responses.success);
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                        }
                                    });
                                }
                                else{
                                    throw("");
                                }
                                await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}});
                            }

                            // Changing rules message by admin 
                            else if(userObj.level === "changing-rules-message"){
                                if(await generalConfigs.Config.updateOne({},{"$set":{rules: message}})){
                                    ctx.reply(levels.admin.responses.success);
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                        }
                                    });
                                }
                                else{
                                    throw("");
                                }
                                await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}});
                            }
                            
                            
                            // Sending to all message handler
                            else if(userObj.level === "send-to-all"){
                                let allUsers = await users.User.find({}).exec();
                                if(allUsers){
                                    allUsers.forEach(item => {
                                        bot.telegram.sendMessage(item.telegram_chat_id,message);
                                    })
                                    ctx.reply(levels.admin.responses.success);
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                        }
                                    });
                                }
                                else{
                                    throw("");
                                }
                                await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}});
                            }
                            
                            
                        }
                        else{
                            throw("");
                        }
                    }
            }
            
            
            // ******************************************
            // ========== Admin Input Handler ===========
            // ******************************************
            if(isAdmin){
                if(message === levels.home.buttons.admin){
                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                        reply_markup: {
                            inline_keyboard: levels.admin.getKeyboardLayout(generals)
                        }
                    });
                }
                
                bot.action(/^admin/,async (ctx) => {
                    
                    let type = ctx.update.callback_query.data.split("%")[1];
                    let cbId = ctx.update.callback_query.id;
    
                    switch(type){
                        case "service-description":
                            ctx.answerCbQuery();
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'changing-service-description'}})){
                                ctx.reply(levels.admin.responses.changeReq);
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;
                        
                        case "payment-description":
                            ctx.answerCbQuery();
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'changing-payment-description'}})){
                                ctx.reply(levels.admin.responses.changeReq);
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;
                            
                        case "send-all":
                            ctx.answerCbQuery();
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'send-to-all'}})){
                                ctx.reply(levels.admin.responses.changeReq);
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;
                            
                        case "troubleshoot-message":
                            ctx.answerCbQuery();
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'changing-troubleshoot-message'}})){
                                ctx.reply(levels.admin.responses.changeReq);
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;
                        
                        case "disconnected-message":
                            ctx.answerCbQuery();
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'changing-disconnected-message'}})){
                                ctx.reply(levels.admin.responses.changeReq);
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;

                        case "lowspeed-message":
                            ctx.answerCbQuery();
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'changing-lowspeed-message'}})){
                                ctx.reply(levels.admin.responses.changeReq);
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;

                        case "rules-message":
                            ctx.answerCbQuery();
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'changing-rules-message'}})){
                                ctx.reply(levels.admin.responses.changeReq);
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;
                            
                            
                        case "service-status":
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}}) && await generalConfigs.Config.updateOne({},{"$set": {service_active: !generals.service_active}})){
                                
                                generals = await generalConfigs.Config.findOne({}).exec();
                                ctx.deleteMessage();
                                bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                    reply_markup: {
                                        inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                    }
                                });
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;
                        
                        case "troubleshoot-status":
                            if (await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'home'}}) && await generalConfigs.Config.updateOne({},{"$set": {service_troubleshoot_active: !generals.service_troubleshoot_active}})){
                                
                                generals = await generalConfigs.Config.findOne({}).exec();
                                ctx.deleteMessage();
                                bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                    reply_markup: {
                                        inline_keyboard: levels.admin.getKeyboardLayout(generals)
                                    }
                                });
                            }
                            
                            else{
                                throw("");
                            }
                            
                            break;
    
                        case "view-stats":
                            let usersCount = await users.User.find({}).count();
                            let activeUsersIds = [];
                            let allaccs = await reqs.Req.find({});
                            allaccs.forEach(item => {
                                if(!activeUsersIds.includes(item.telegram_chat_id)){
                                    activeUsersIds.push(item.telegram_chat_id);
                                }
                            })
                            ctx.reply(levels.admin.getStatsString({
                                users: usersCount,
                                activeUsers: activeUsersIds.length,
                                accounts: allaccs.length
                            }));
                            break;
                            
                        case "new-reqs":
                            userObj.level = "admin_new_reqs";
                            if(await userObj.save()){
                                let newReqs = await reqs.Req.find({checked: false, screenshot: false}).exec();
                                if(newReqs){
                                
                                    ctx.deleteMessage();
                                    bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getReqsKeyboardLayout(newReqs)
                                        }
                                    });
                                    
                                }
                                break;
                            }
                            else{
                                throw("به روزرسانی سطح انجام نشد");
                            }
                        
                        case "new-reqs-screenshot":
                            let newReq = await reqs.Req.findOne({checked: false, screenshot: true, status: "complete"}).exec();
                            let rCount = await reqs.Req.find({checked: false, screenshot: true, status: "complete"}).count();
                            if (newReq){
                                if(await users.User.updateOne({telegram_chat_id:ctx.chat.id},{'$set':{level: 'admin-screenshot'}})){
                                    ctx.deleteMessage();
                                    bot.telegram.sendPhoto(ctx.chat.id,newReq.screenshot_file_id,{
                                        reply_markup: {
                                            inline_keyboard: levels.admin.getScreenshotReqKeyboard(newReq,rCount)
                                        }
                                    });
                                }
                            }
                            break;
                            
                        default:

                            if(type.includes("add-config")){
                                let id = type.split('-')[2];
                                let req = await reqs.Req.findOne({_id: id}).exec();
                                if(req.checked){
                                    return;
                                }

                                users.User.updateOne({telegram_chat_id: ctx.chat.id},{"$set":{level: type}}).exec().then(()=>{
                                    ctx.reply(levels.admin.responses.configReq);
                                }).catch(e => {
                                    throw(e);
                                })
                            }
                        
                            if(type.includes("req-approve")){
                                
                                // Checking request type
                                let id = type.split('-')[2];
                                let req = await reqs.Req.findOne({_id: id}).exec();
                                if(req.checked){
                                    return;
                                }
                                if(req.config === null || req.config == ""){
                                    ctx.reply(levels.admin.responses.configNotFound);
                                    return;
                                }
                                    
                                // Insert new account into db
                                let newAccount = new accountModel.Account({
                                    telegram_chat_id: req.telegram_chat_id,
                                    telegram_username: req.telegram_username,
                                    screenshot_file_id: (req.screenshot && req.screenshot_file_id !== null) ? req.screenshot_file_id : null,
                                    config: req.config,
                                    plan: req.plan,
                                    operator: req.operator,
                                    creation_date: new Date().toLocaleDateString()
                                });
                    
                                newAccount.save().then(async (value) => {
                    
                                    req.approved = true;
                                    req.checked = true;
                                    
                                    if(await req.save()){
                                        bot.telegram.sendMessage(req.telegram_chat_id,levels.purchase.decorateAccount({id: req._id,config: req.config}),{
                                            parse_mode: "HTML"
                                        });
                                        
                                        // Set new keyboard
                                        let user = await users.User.findOne({telegram_chat_id: ctx.chat.id}).exec();
                                        if(user){
                                            user.accounts_purchased += 1;
                                            user.save();
                                            
                                            if(user.level === "admin-screenshot"){
                                                let newReq = await reqs.Req.findOne({checked: false, screenshot: true}).exec();
                                                let rCount = await reqs.Req.find({checked: false, screenshot: true}).count();
                                                if (newReq && rCount){
                                                    bot.telegram.sendPhoto(ctx.chat.id,newReq.screenshot_file_id,{
                                                        reply_markup: {
                                                            inline_keyboard: levels.admin.getScreenshotReqKeyboard(newReq,rCount)
                                                        }
                                                    });
                                                }
                                                else{
                                                    ctx.reply("درخواست جدیدی وجود ندارد");
                                                }
                                            }
                                            else{
                                                let newReqs = await reqs.Req.find({checked: false, screenshot: false}).exec();
                                                ctx.deleteMessage();
                                                bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                                    reply_markup: {
                                                        inline_keyboard: levels.admin.getReqsKeyboardLayout(newReqs)
                                                    }
                                                });
                                            }
                                        }
                                    }
                                    else{
                                        throw(`
                                        ذخیره اکانت در دیتابیس با موفقیت انجام شد.
                                        به روزرسانی درخواست به حالت تایید شده ناموفق بود.
                                        اطلاعات اکانت برای کاربر ارسال نگردید
                                        `);
                                    }
                                    
                                }).catch(e => {
                                    console.log(e);
                                    throw("ذخیره اکانت در دیتابیس ناموفق بود");
                                })
                            
                                
                            }
                            
                            if(type.includes("req-reject")){
                                let user = await users.User.findOne({telegram_chat_id: ctx.chat.id}).exec();
                                let id = type.split('-')[2];
                                if(await reqs.Req.updateOne({_id: id},{approved: false,checked: true})){
                                    if(user){
                                        if(user.level === "admin-screenshot"){
                                            let newReq = await reqs.Req.findOne({checked: false, screenshot: true}).exec();
                                            let rCount = await reqs.Req.find({checked: false, screenshot: true}).count();
                                            if (newReq){
                                                ctx.deleteMessage();
                                                bot.telegram.sendPhoto(ctx.chat.id,newReq.screenshot_file_id,{
                                                    reply_markup: {
                                                        inline_keyboard: levels.admin.getScreenshotReqKeyboard(newReq,rCount)
                                                    }
                                                });
                                            }
                                            else{
                                                ctx.deleteMessage();
                                                ctx.reply("درخواست جدیدی وجود ندارد");
                                            }
                                        }
                                        else{
                                            let newReqs = await reqs.Req.find({checked: false, screenshot: false}).exec();
                                            bot.telegram.sendMessage(ctx.chat.id,levels.admin.responses.menu,{
                                                reply_markup: {
                                                    inline_keyboard: levels.admin.getReqsKeyboardLayout(newReqs)
                                                }
                                            });
                                        }
                                    }
                                    reqs.Req.findOne({_id: id}).exec().then(req => {
                                        let refCode = req.screenshot ? id : req.ref_id;
                                        ctx.telegram.sendMessage(req.telegram_chat_id,levels.purchase.responses.rejectedPayment + "\n\nشماره رهگیری پرداخت/آی دی تصویر: " + refCode );
                                    });
                                }
                                
                                else{
                                    ctx.answerCbQuery("خطایی پیش آمد مجددا تلاش کنید");
                                }
                            }
                    }
                })
                
            }
        
        
        // ***********************************
        // ======== Exception Handler ========
        // ***********************************
        }).catch(e => {
            if(e === "" || e.length === 0){
                ctx.reply("متاسفانه خطایی پیش آمد. دوباره تلاش کنید");
            }
            else{
                ctx.reply(e);
            }
            return 0;
        });

    }).catch((e)=>{
        console.log(e);
        throw(e);
    })
    
    
})


bot
	.launch({ webhook: { domain: config.get("domain"), port: config.get("port") } })
	.then(() => console.log("Webhook bot listening on port", config.get("port")));

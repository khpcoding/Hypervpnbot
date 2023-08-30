let levels = {
    general: {
        responses:{
            notsub: `سلام خدمت شما کاربر عزیز
به فروشگاه هایپر خوش آمدید 🌹 
لطفا جهت استفاده از ربات در کانال زیر عضو شوید سپس برای شروع کار با ربات بر روی /start کلیک کنید🙏🏻 
            
https://t.me/Hypeershop`,
            subscription: `
            سلام
به ربات هایپر خوش آمدید

با استفاده از این ربات شما میتوانید خدمات زیر را به راحتی در اختیار داشته باشید
- خرید اکانت
- دریافت آموزش های لازم
- دریافت اطلاعیه ها و پیام های همگانی
- رفع کندی و قطعی های اتصال
            `,
            troubleshoot: "🔹 در حال حاضر سرویس در دست تعمیر می باشد. مشکلات قطعی و یا اختلال شما تا ساعات آینده برطرف خواهد شد",
            tutorials: `برای مشاهده آموزش راه اندازی وارد لینک زیر شوید  : 

https://t.me/helprunservershypervpn`
        },
        buttons: {
            back: "🔙 بازگشت به منوی اصلی"  
        }
    },
    admin: {
        responses:{
            menu: `
            🎛 منوی ادمین

با استفاده از منوی زیر میتوانید تنظیمات مورد نظر را بر روی ربات اعمال کرده و یا از امکانات مختلف ادمین استفاده کنید
            `,
            changeReq: "لطفا متن مورد نظر خود را ارسال کنید",
            success: "عملیات با موفقیت انجام شد",
            accountReq: "لطفا فایل های اکانت را ارسال کنید",
            configReq: "لطفا کانفیگ مورد نظر را وارد کنید",
            configNotFound: "کانفیگی برای این اکانت ثبت نشده",
            configAdded: "کانفیگ اضافه شد"
        },
        buttons: {
            serviceDescription: "تغییر متن توضیحات سرویس",
            paymentDescription: "تغییر متن روش پرداخت",
            sendAllMessage: "ارسال پیام همگانی",
            troubleshootMessage: "تغییر متن ارتباط با پشتیبانی",
            disconnectedMessage: "تغییر متن قطعی",
            lowspeedMessage: "تغییر متن کندی",
            rulesMessage: "تغییر قوانین",
            serviceStatus: "سرویس دهی",
            troubleshootStatus: "حالت تعمیر",
            serviceActive: "✅ فعال",
            serviceNotActive: "❌ غیرفعال",
            viewNewReqsScreenShot: "مشاهده و تایید پرداخت ها",
        },
        getKeyboardLayout: (configs) => {
            let kb = [
                [{text: levels.admin.buttons.serviceDescription, callback_data: "admin%service-description"}],
                [{text: levels.admin.buttons.paymentDescription, callback_data: "admin%payment-description"}],
                [{text: levels.admin.buttons.sendAllMessage, callback_data: "admin%send-all"}],
                [{text: levels.admin.buttons.troubleshootMessage, callback_data: "admin%troubleshoot-message"}],
                [{text: levels.admin.buttons.disconnectedMessage, callback_data: "admin%disconnected-message"}],
                [{text: levels.admin.buttons.lowspeedMessage, callback_data: "admin%lowspeed-message"}],
                [{text: levels.admin.buttons.rulesMessage, callback_data: "admin%rules-message"}],
                [{text: levels.admin.buttons.serviceStatus, callback_data: "admin%service-status"},{text: (configs.service_active ? levels.admin.buttons.serviceActive : levels.admin.buttons.serviceNotActive), callback_data: "admin%service-status"}],
                [{text: levels.admin.buttons.viewNewReqsScreenShot, callback_data: "admin%new-reqs-screenshot"}],
            ]; 
            return kb;
        },
        getReqsKeyboardLayout: (reqs) => {
            let kb = [];
            for(let i=0;i<10;i++){
                if(reqs[i]){
                    let item = reqs[i];
                    kb.push(
                    [{text: `${item.caption ? item.caption : "کپشنی ارسال نشده است"}`, callback_data: "label"}],
                    [{text: `u/c: ${item.telegram_username ? item.telegram_username : item.telegram_chat_id} / ref: ${item.ref_id}`, callback_data: "label"}],
                    [{text: `${item.plan ? item.plan : "پلن مشخص نشده"}`, callback_data: "label"}],
                    [{text: `${item.operator ? item.operator : "اپراتور مشخص نشده"}`, callback_data: "label"}],
                    [{text: `وارد کردن کانفیگ اکانت`, callback_data: `admin%add-config-${item._id}`}],
                    [{text: '✅', callback_data:`admin%req-approve-${item._id}`},
                    {text: '❌', callback_data:`admin%req-reject-${item._id}`}]);
                }
            }
            kb.push(
                [{text: `درخواست های باقی مانده: ${reqs.length}`, callback_data: "remaining"}]
            );
            return kb;
        },
        getScreenshotReqKeyboard: (req,remaining) => {
            return [
                    [{text: `${req.caption ? req.caption : "کپشنی ارسال نشده است"}`, callback_data: "label"}],
                    [{text: `u/c: ${req.telegram_username ? req.telegram_username : req.telegram_chat_id}`, callback_data: "reqUsername"}],
                    [{text: `${req.plan ? req.plan : "پلن مشخص نشده"}`, callback_data: "label"}],
                    [{text: `${req.operator ? req.operator : "اپراتور مشخص نشده"}`, callback_data: "label"}],
                    [{text: `وارد کردن کانفیگ اکانت`, callback_data: `admin%add-config-${req._id}`}],
                    [{text: '✅', callback_data:`admin%req-approve-${req._id}`},
                    {text: '❌', callback_data:`admin%req-reject-${req._id}`}],
                    [{text: `درخواست های باقی مانده: ${remaining}`, callback_data: "remaining"}]
            ];
        },
        getAccountsToShut: (ids) => {
            return `اکانت هایی که تمدید نکرده و باید قطع شوند: \n\n ${ids} \n\n`;
        },
        getStatsString: (data) => {
            return `
✅ آمار ربات

تعداد کاربران: ${data.users}
تعداد کاربرانی که تا به حال اکانت خریداری کرده اند: ${data.activeUsers}
تعداد اکانت های فروخته شده: ${data.accounts}
            `;
        }
    },
    home: {
        response: "به ربات هایپر خوش آمدید",
        buttons: {
            purchase: "🛒 خرید سرویس جدید / تمدید",
            troubleshoot: "👤 ارتباط با پشتیبانی",
            renewal: "🧾 وضعیت / تمدید سرویس",
            tutorials: "🪄 آموزش نصب و راه اندازی",
            checkReq: "🔍 پیگیری پرداخت ها",
            lowspeed: "⚠️ کندی سرویس",
            disconnected: "❌ گزارش قطعی",
            rules: "📃 قوانین خرید",
            admin: "⚙️ ادمین"
        },
        getKeyboardLayout: (admin = false) => {
            let kb = [
                [levels.home.buttons.purchase],
                [levels.home.buttons.troubleshoot,levels.home.buttons.tutorials],
                [levels.home.buttons.checkReq,levels.home.buttons.rules],
                [levels.home.buttons.lowspeed,levels.home.buttons.disconnected]
            ];
            if(admin) kb.push([levels.home.buttons.admin])
            return kb;
        }
    },
    purchase: {
        responses:{
            payment: `
🧾 لطفا پس از پرداخت، اسکرین شات صفحه پرداخت خود را برای ربات ارسال کنید

⚠️دقت داشته باشید که در هر بار خرید از ربات، تنها یک اکانت قابل خریداری است. بنابراین از پرداخت مبلغ های بیشتر از هزینه یک اکانت خودداری کنید.
✅ در صورتی که قصد خرید چند اکانت دارید میتوانید هر خرید را جداگانه انجام دهید. همچنین در صورتی که قصد همکاری در فروش و یا خرید عمده را دارید میتوانید با اکانت پشتیبانی در ارتباط باشید
            `,
            success: `
            ✅ پرداخت شما در انتظار تایید است. به محض تایید، اکانت شما از طریق ربات ارسال خواهد شد.
⚠️ با توجه به زیاد بودن تعداد درخواست ها، این فرآیند ممکن است تا یک روز کاری زمان ببرد

در صورت وجود هر گونه مشکل و یا ابهام میتوانید به پشتیبانی پیام دهید
            `,
            accountHeader: `
            ✅ پرداخت شما تایید شد
🔹اکانت وی پی ان شما:`,
            accountFooter: "*برای آموزش استفاده از اکانت میتوانید از بخش آموزش ها در ربات استفاده نمایید*",
            rejectedPayment: "❌ متاسفانه پرداخت شما تایید نشد. جهت بررسی های بیشتر به ادمین پشتیبانی پیام دهید",
            notActive: `
            🙏 با عرض پوزش در حال حاضر از سرویس دهی معذور می باشیم
آغاز سرویس دهی مجدد از طریق ربات اطلاع رسانی خواهد شد
            `,
            noAccount: "🙏 متاسفانه در حال حاضر ظرفیت اکانت ها به پایان رسیده است. لطفا بعدا مجدد تلاش فرمایید"
        },
        buttons: {
            accept: "☑️ مرحله بعدی (پرداخت)",
            operators: {
                op1: "همراه اول",
                op2: "ایرانسل و رایتل"
            }
        },
        getKeyboardOperatorLayout: () => {
            return [
                [levels.purchase.buttons.operators.op1,levels.purchase.buttons.operators.op2],
                [levels.general.buttons.back]
            ];
        },
        getKeyboardLayout: () => {
            return [
                [levels.purchase.buttons.accept],
                [levels.general.buttons.back]
            ];
        },
        decorateAccount: (account) => {
            return levels.purchase.responses.accountHeader + "\n\n" + "آیدی:\n" + account.id + "\n\nلینک اکانت:\n" + account.config + "\n\n" + levels.purchase.responses.accountFooter;
        }
    },
    plans: {
        responses:{
            menu: "یکی از پلن ها را انتخاب کنید"
        },
        buttons: {
            p1: " (مدت محدود)اشتراک یک ماهه تک کاربره - 80 هزار تومان",
            p2: "اشتراک دو ماهه تک کاربره - 250 هزار تومان",
            p3: "اشتراک سه ماهه تک کاربره - 350 هزار تومان",
            p4: "اشتراک یک ماهه دو کاربره - 250 هزار تومان",
            p5: "اشتراک دو ماهه دو کاربره - 330 هزار تومان",
            p6: "اشتراک سه ماهه دو کاربره - 450 هزار تومان",

        },
        getKeyboardLayout: ()=>{
            return [
                [levels.plans.buttons.p1],
                [levels.plans.buttons.p2],
                [levels.plans.buttons.p3],
                [levels.plans.buttons.p4],
                [levels.plans.buttons.p5],
                [levels.plans.buttons.p6],
                [levels.general.buttons.back]
            ]
        }
    },
    reqs: {
        responses: {
            noEntry: "🔻 تا به حال هیچ درخواستی از سمت شما در ربات ثبت نشده است",
            list: `
            ☑️ درخواست های زیر تا به حال برای شما ثبت شده اند

در هر درخواست:
- کد رهگیری پرداخت / آیدی تصویر ارسالی
- تاریخ
- وضعیت تایید درخواست

مشخص شده اند.

با انتخاب درخواست هایی که وضعیت آن ها تایید شده می باشد میتوانید اطلاعات اکانت وی پی ان آن درخواست را مشاهده کنید
            `,
            waiting: "این درخواست همچنان در انتظار تایید است. در صورتی که مدت زیادی از ثبت درخواست گذشته میتوانید با آیدی پشتیبانی (@hyper_connections) در ارتباط باشید",
        },
        getKeyboardLayout: (reqs) => {
            let kb = [];
            reqs.forEach((item) => {
                let itemType = item.screenshot ? "تصویر ارسالی: " : "کد رهگیری پرداخت: ";
                let itemId = item.screenshot ? item._id : item.ref_id
                kb.push([itemType + itemId + " | " + (item.checked ? (item.approved ? "✅ تایید شده" : "❌ رد شده") : "🔍 در انتظار تایید") + " | " + item.creation_date]);
            });
            kb.push([levels.general.buttons.back]);
            return kb;
        }
    }
}

module.exports = levels;
const { default: axios } = require("axios");
const CreateOfferImage = require("../utils/createOfferImage");
const client = require("../database/redis");
const Database = require('../database/database');
const GetAllOffers = require("./getOffers");
const db = new Database()

async function checkAndUpdateAmazonAndFlipkartOffers() {
    try {
        const { offers } = await GetAllOffers()
        await OfferNotification(offers)
        console.log('all update completed')
        return { success: true, offers };
    } catch (error) {
        console.error("Error in checkAndUpdateAmazonAndFlipkartOffers:", error.message);
        throw error;
    }
}


async function OfferNotification(Offers) {

    for (let i = 0; i < Offers.length; i++) {
        const item = Offers[i];
        const discription = item.discription
        const store = item.store
        const mrpPrice = item.mrp
        const dealPrice = item.dealPrice
        const note = item.notes
        const imageSrc = item.imageSrc
        const discountPercentage = item.discountPercentage
        const id = item.id
        const Uri = item.affliateLink
        const dealType = item.dealType

        const { success, src } = await CreateOfferImage({ imageSrc, mrpPrice, dealPrice, discountPercentage, discription, note, store })
        if (success) {
            if (dealType == 1 || dealType == 2) {
                const displayUrl = store == 'Amazon' ? 'Amazon.com' : `${store}.com`
                const { result: { message_id, sender_chat: { username }, result } } = await sendNotificationto_Telegram(src, item, displayUrl, Uri)
                item.telegramRes = { message_id, username }
            }

            let prevUpdatedOffers = JSON.parse(await client.get("updated_Offers")) || [];

            item.offerImg = src
            prevUpdatedOffers.push(id)

            await client.set('updated_Offers', JSON.stringify(prevUpdatedOffers))
            await db.addLogs(item, 'deals')
        } else console.log('cannot create offerimage')
    }
}

function sendNotificationto_Telegram(image, attributes, linkPlaceHolder, Uri) {
    return new Promise(async (resolve, reject) => {
        try {
            const botToken = '6844013809:AAFGdbPC3llAuyI1VMnm915mo1G7UWNJry4';
            const channelId = '@DropNotifypro';
            const apiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;


            const inlineKeyboardWithUrls = {
                inline_keyboard: [[{ text: `Buy on ${attributes.store} Now`, url: Uri }]]
            };

            let msg = genarateNotificationMessage(attributes, Uri, linkPlaceHolder)
            const messageCaption = `${msg} \n\njoin @DropNotifypro for more Deals`;
            const payload = {
                chat_id: channelId,
                photo: image,
                caption: messageCaption,
                reply_markup: JSON.stringify(inlineKeyboardWithUrls),
                parse_mode: 'HTML',
            };

            const { data } = await axios.post(apiUrl, payload)
            resolve(data)
        } catch (error) {
            reject(error)
        }
    })
}

function genarateNotificationMessage(attributes, url, linkPlaceHolder) {
    try {
        const discription = attributes.discription
        const mrp = attributes.mrp
        const deal = attributes.dealPrice
        const note = attributes.notes
        const dealType = attributes.dealType
        const lowestprice = attributes.lowestprice
        const hotness = attributes.hotness
        const lootDealText = "The product is now at its lowest price ever, so it's the perfect time to buy 🔥"
        const hotDealText = `The price is now ${lowestprice == dealPrice ? '' : 'almost'} same as its all-time low of ${lowestprice}. Sounds great 😘`
        const dealDiscription = dealType == 1 ? '#Hot_deal' : dealType == 2 ? '#Loot_deal' : ''

        let message = ''
        if (note) message = `${dealDiscription}\n<b>${discription.length > 80 ? discription.slice(0, 80) + '...' : discription}</b>\n\nMrp : <s>${mrp} Rs</s>\n<b>Deal Price : ${deal} Rs</b>\n\n• ${note}\n\n<i>${dealType == 1 ? hotDealText : dealType == 2 ? lootDealText : ''}</i>\n\nShop now from <b><a href="${url}">${linkPlaceHolder}</a></b>`
        else message = `${dealDiscription}\n<b>${discription.length > 80 ? discription.slice(0, 80) + '...' : discription}</b>\n\nMrp : <s>${mrp} Rs</s>\n<b>Deal Price : ${deal} Rs</b>\n\n<i>${dealType == 1 ? hotDealText : dealType == 2 ? lootDealText : ''}</i>\n\nShop now from <b><a href="${url}">${linkPlaceHolder}</a></b>`

        return message
    } catch (error) {
        console.log(error)
    }
}

module.exports = checkAndUpdateAmazonAndFlipkartOffers;

// checkAndUpdateAmazonAndFlipkartOffers()
const { default: axios } = require("axios");
const CreateOfferImage = require("../utils/createOfferImage");
const GetAmazonOffers = require("./getAmazonOffers");
const GetFlipkartOffers = require("./getFlipkartOffers");
const GetallOtherOffers = require("./getallOtherOffers");
const client = require("../database/redis");

async function checkAndUpdateAmazonAndFlipkartOffers() {
    try {
        const [AmazonOffers = [], FlipkartOffers = [], OtherOffers = []] = await Promise.all([
            GetAmazonOffers(),
            // GetFlipkartOffers(),
            // GetallOtherOffers(),
        ])

        await AmazonOfferNotification(AmazonOffers.reverse())
        await flipkartOfferNotification(FlipkartOffers.reverse())
        await otherOfferNotification(OtherOffers.reverse())
        console.log('all update completed')
        return { AmazonOffers, FlipkartOffers, OtherOffers };
    } catch (error) {
        console.error("Error in checkAndUpdateAmazonAndFlipkartOffers:", error.message);
        throw error;
    }
}


async function AmazonOfferNotification(AmazonOffers) {

    for (let i = 0; i < AmazonOffers.length; i++) {
        const item = AmazonOffers[i];
        const discription = item.description
        const store = item.store
        const mrpPrice = item.originalPrice
        const dealPrice = item.dealPrice
        const note = item.note
        const couponCode = item.copencode
        const imageSrc = item.imgSrc
        const discountPercentage = item.offerPer
        const id = item.valueofD
        const Uri = item.productUri.Uri
        const { success, src } = await CreateOfferImage({ imageSrc, couponCode, mrpPrice, dealPrice, discountPercentage, discription, note, store })
        console.log(src)
        if (success) {
            const { result: { message_id, sender_chat: { username } } } = await sendNotificationto_Telegram(src, item, 'Amazon.in', Uri)

            let prevUpdatedOffers = JSON.parse(await client.get("updated_AmazonOffers")) || [];

            delete item.valueofD
            item.offerImg = src
            item.telegramRes = { message_id, username }
            prevUpdatedOffers.push({ id, ...item })

            await client.set('updated_AmazonOffers', JSON.stringify(prevUpdatedOffers))
        }
    }
}

async function flipkartOfferNotification(FlipkartOffers) {
    for (let i = 0; i < FlipkartOffers.length; i++) {
        const item = FlipkartOffers[i];
        const discription = item.description
        const store = item.store
        const mrpPrice = item.originalPrice
        const dealPrice = item.dealPrice
        const note = item.note
        const couponCode = item.copencode
        const imageSrc = item.imgSrc
        const discountPercentage = item.offerPer
        const id = item.valueofD
        const Uri = item.affliateLink

        const { success, src } = await CreateOfferImage({ imageSrc, couponCode, mrpPrice, dealPrice, discountPercentage, discription, note, store })

        if (success) {
            const { result: { message_id, sender_chat: { username } } } = await sendNotificationto_Telegram(src, item, 'Flipkart.com', Uri)

            let prevUpdatedOffers = JSON.parse(await client.get("updated_FlipkartOffers")) || [];

            delete item.valueofD
            item.offerImg = src
            item.telegramRes = { message_id, username }
            prevUpdatedOffers.push({ id, ...item })

            await client.set('updated_FlipkartOffers', JSON.stringify(prevUpdatedOffers))

        }
    }
}

async function otherOfferNotification(otherOffers) {
    for (let i = 0; i < otherOffers.length; i++) {
        const item = otherOffers[i];
        const discription = item.description
        const store = item.store
        const mrpPrice = item.originalPrice
        const dealPrice = item.dealPrice
        const note = item.note
        const couponCode = item.copencode
        const imageSrc = item.imgSrc
        const discountPercentage = item.offerPer
        const id = item.valueofD
        const Uri = item.affliateLink

        const { success, src } = await CreateOfferImage({ imageSrc, couponCode, mrpPrice, dealPrice, discountPercentage, discription, note, store })
        if (success) {

            const { result: { message_id, sender_chat: { username } } } = await sendNotificationto_Telegram(src, item, `${store}.com`, Uri)

            let prevUpdatedOffers = JSON.parse(await client.get("updated_AllOtherOffers")) || [];

            delete item.valueofD
            item.offerImg = src
            item.telegramRes = { message_id, username }
            prevUpdatedOffers.push({ id, ...item })

            await client.set('updated_AllOtherOffers', JSON.stringify(prevUpdatedOffers))

        }
    }

}

function sendNotificationto_Telegram(image, attributes, linkPlaceHolder, Uri) {

    return new Promise(async (resolve, reject) => {
        try {
            const botToken = '6844013809:AAFGdbPC3llAuyI1VMnm915mo1G7UWNJry4';
            const channelId = '@DropNotifypro';
            const apiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;

            let msg = genarateNotificationMessage(attributes, Uri, linkPlaceHolder)
            const messageCaption = `${msg} \n\njoin @DropNotifypro for more offers`;
            const payload = {
                chat_id: channelId,
                photo: image,
                caption: messageCaption,
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
        const discription = attributes.description
        const store = attributes.store
        const mrp = attributes.originalPrice
        const deal = attributes.dealPrice
        const note = attributes.note
        const copencode = attributes.copencode

        let message = ''
        if (note && copencode) message = `${discription.length > 80 ? discription.slice(0, 80) + '...' : discription}\non ${store}\n\nMrp : <s>${mrp} Rs</s>\n<b>DEAL : ${deal} Rs</b>\n\n<b>Use code <code>${copencode}</code></b>\nwhen checkout\n\n• ${note}\n\nShop now from <b><a href="${url}">${linkPlaceHolder}</a></b>`
        else if (copencode && !note) message = `${discription.length > 80 ? discription.slice(0, 80) + '...' : discription}\non ${store}\n\nMrp : <s>${mrp} Rs</s>\n<b>DEAL : ${deal} Rs</b>\n\n<b>Use code <code>${copencode}</code></b>\nwhen checkout\n\nShop now from <b><a href="${url}">${linkPlaceHolder}</a></b>`
        else if (note && !copencode) message = `${discription.length > 80 ? discription.slice(0, 80) + '...' : discription}\non ${store}\n\nMrp : <s>${mrp} Rs</s>\n<b>DEAL : ${deal} Rs</b>\n\n• ${note}\n\nShop now from <b><a href="${url}">${linkPlaceHolder}</a></b>`
        else message = `${discription.length > 80 ? discription.slice(0, 80) + '...' : discription}\non ${store}\n\nMrp : <s>${mrp} Rs</s>\n<b>DEAL : ${deal} Rs</b>\n\nShop now from <b><a href="${url}">${linkPlaceHolder}</a></b>`

        return message
    } catch (error) {
        console.log(error)
    }
}

module.exports = checkAndUpdateAmazonAndFlipkartOffers;

checkAndUpdateAmazonAndFlipkartOffers()
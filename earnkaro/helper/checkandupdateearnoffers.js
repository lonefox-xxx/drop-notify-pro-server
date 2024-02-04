const { default: axios } = require("axios");
const client = require("../../database/redis");
const GetEarnkaroProductLink = require("./getProductLink");
const getallEarnkaroOffers = require("./getallOffers")
const _ = require('lodash');
const GetDelay = require("../../utils/earnkaro/getDelay");

function CheckandUpdateEarnkaroOffers() {
    return new Promise(async (resolve, reject) => {
        try {
            const { data: { props: { pageProps: { data } } } } = await getallEarnkaroOffers()
            let prevUpdatedOffers = JSON.parse(await client.get('updated_EarnkaroOffers')) || []
            const newOffers = _.differenceWith(data, prevUpdatedOffers, _.isEqual);
            const { totalUpdatecount = 0, updatedProducts = [] } = await updateEarnkaoOffersandSendNotification(newOffers.reverse())
            if (totalUpdatecount > 0) {
                const newUpdatedArray = prevUpdatedOffers.concat(updatedProducts)
                await client.set('updated_EarnkaroOffers', JSON.stringify(newUpdatedArray))
            }

            resolve({ success: true, totalUpdatecount })
        } catch (error) {
            reject(error)
        }
    })
}


function updateEarnkaoOffersandSendNotification(offers) {
    return new Promise(async (resolve, reject) => {
        try {
            if (offers.length === 0) return resolve({ totalUpdatecount: 0, updatedProducts: [] })

            const updatedProducts = []

            for (let i = 0; i < offers.length; i++) {
                const element = offers[i];
                const { id, type, attributes } = element;
                const { merchant_offer_id, image_url } = attributes
                const { data: shareinfo } = await GetEarnkaroProductLink({ itemId: merchant_offer_id, itemProductId: id, itemType: "product" })
                await sendEarnkaroOffernotificationtotelegram(attributes, shareinfo)
                updatedProducts.push(element)
            }

            resolve({ totalUpdatecount: updatedProducts.length, updatedProducts });
        } catch (error) {
            reject(error);
        }
    });
}

function sendEarnkaroOffernotificationtotelegram(attributes, shareinfo) {

    return new Promise(async (resolve, reject) => {
        try {
            const botToken = '6844013809:AAFGdbPC3llAuyI1VMnm915mo1G7UWNJry4';
            const channelId = '@DropNotifypro';
            const apiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;

            let msg = genarateNotificationMessage(attributes, shareinfo)
            const messageCaption = `${msg} \n\njoin @DropNotifypro for more offers`;
            const imageUrl = attributes.image_url;

            const payload = {
                chat_id: channelId,
                photo: imageUrl,
                caption: messageCaption,
                parse_mode: 'HTML',
            };

            await axios.post(apiUrl, payload)
            await sleep(GetDelay(3000, 5000))
            resolve(true)
        } catch (error) {
            reject(error)
        }
    })
}

function extractPromoCode(text) {
    const codeMatch = text.match(/Use\sCode:\s([^\n\r]+)/);
    return codeMatch ? codeMatch[1] : null;
}

function genarateNotificationMessage(attribute, sharinfo) {

    try {
        const url = new URL(sharinfo.wa_share_link);
        const textParameterValue = url.searchParams.get('text');
        const promoCode = extractPromoCode(textParameterValue);
        const sharlink = sharinfo.shared_link

        const offerPrice = attribute.category_price_starting_from
        const offerText = attribute.name
        const brand = attribute.brand
        const from = attribute.merchant_name
        const starttime = attribute.product_start_datetime
        const endtime = attribute.product_end_datetime
        const endsin = calculateTimeDifference(endtime)

        let message = ''
        if (promoCode) message = `Get ${offerText}\n\nFrom : ${from}\nOffer price : ${offerPrice}\n\n<b>Use this code <code>${promoCode}</code></b>\nwhen checkout\n\n<b>Shop now from ${sharlink}</b>\nDeal end in ${endsin}`
        else message = `Get ${offerText}\n\nFrom : ${from}\nOffer price : ${offerPrice}\n\n<b>Shop now from ${sharlink}</b>\nDeal end in ${endsin}`
        return message

    } catch (error) {
        console.log(error)
    }
}

function calculateTimeDifference(endDatetimeStr) {
    const options = { timeZone: 'Asia/Kolkata' };
    const currentDatetime = new Date().toLocaleString('en-US', options);
    const timeDifference = new Date(endDatetimeStr) - new Date(currentDatetime);
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let formattedDifference = '';

    if (days <= 0) formattedDifference = `${hours} hour${hours !== 1 ? 's' : ''}`
    else formattedDifference = `${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`

    return formattedDifference;
}

const sleep = (ms) => new Promise((resolve, reject) => setTimeout(() => resolve(true), ms));

module.exports = CheckandUpdateEarnkaroOffers;
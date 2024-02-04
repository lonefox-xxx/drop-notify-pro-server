const { default: axios } = require("axios");
const Cheerio = require('cheerio');
const client = require("../database/redis");
const ms = require("ms");
const supportedStors = require('./supportedStores');
const UserAgent = require("user-agents");
const genarateEarnkaroLinkForProducts = require("../earnkaro/createlinkforAllproducts/genarateLinkForProducts");
const GetDelay = require("../utils/earnkaro/getDelay");
const sleep = require("../utils/sleep");
async function GetallOtherOffers() {

    try {
        const prevUpdatedOffers = JSON.parse(await client.get("updated_AllOtherOffers")) || [];
        const lastUpdatedOffer = prevUpdatedOffers[prevUpdatedOffers?.length - 1 || 0] || null
        const Alloffers = [];
        let page = 1
        while (true) {
            const userAgent = new UserAgent();
            const parsedUserAgent = userAgent.toString()
            const headers = { 'User-Agent': `${parsedUserAgent}` };
            const { data } = await axios.get(`https://www.dealsmagnet.com/new?page=${page}`, { headers });
            const { success, reachEnd, offers } = await GetData(data, lastUpdatedOffer)
            if (success) {
                Alloffers.push(...offers)
                page++;
            }
            if (!success) console.log('no success')
            if (reachEnd) {
                break;
            }
        }

        if (Alloffers.length > 0) {
            const LinkArray = Alloffers.map(offer => offer.productUri.Uri)
            const linkString = LinkArray.join('\n');
            const { data: { data: Uris }, status } = await genarateEarnkaroLinkForProducts(linkString)
            const uriarray = Uris.split('\n')
            uriarray.forEach((uri, i) => {
                Alloffers[i].affliateLink = uri
            });
        }

        return Alloffers;
    } catch (error) {
        throw error;
    }
}

module.exports = GetallOtherOffers;


function GetData(data, lastUpdatedOffer) {
    return new Promise(async (resolve, reject) => {
        try {
            const lastUpdatedOfferId = lastUpdatedOffer?.id || null

            const $ = Cheerio.load(data);
            const hotdeals = $('div.hotdeal:not(.expired)');
            const offers = [];

            for (let index = 0; index < hotdeals.length; index++) {
                const element = hotdeals[index];
                const link = $(element);
                const dataCode = link.find('.btn.buy-button').attr('data-code');
                const valueofD = new URLSearchParams(dataCode).get('d');
                if (valueofD == lastUpdatedOfferId) {
                    resolve({ success: true, offers, reachEnd: true });
                    break;
                }

                const durationText = link.find('div.TimeDuration').text().trim();
                const durationInMilliseconds = ms(durationText);
                const note = link.find('div.Ribbon').text().trim() || null;
                const description = link.find('a.MainCardAnchore').text().replace(note, '').replace(/\n/g, '').trim();
                const originalPrice = +link.find('div.card-OriginalPrice').text().trim().replace(/[^\d]/g, '');
                const dealPrice = +link.find('div.card-DealPrice').text().trim().replace(/[^\d]/g, '');
                const offerPer = +link.find('span.big').text().trim().replace(/[^\d]/g, '');
                const imgSrc = link.find('div.card-img img.lazy.card-img-top').attr('data-src');
                const coopendiv = link.find('.Card-CopyCoupon').attr('onclick');
                let copencode = /CopyCoupon\('([^']+)'/i.exec(coopendiv);
                copencode = copencode && copencode[1] || null;
                const store = link.find('div.col-5.p-0.pt-1.bg-white.rounded.text-center.mt-1  a img').attr('alt');
                const OtherSuppordedStores = getStores()

                if (durationInMilliseconds >= 86400000) {
                    resolve({ success: true, offers, reachEnd: true });
                    break;
                }
                if (OtherSuppordedStores.includes(store)) {
                    const productUri = await ExtractOfferURL(dataCode)
                    if (store && OtherSuppordedStores.includes(store) && productUri.Uri) {
                        offers.push({ data: dataCode, valueofD, description, note, originalPrice, dealPrice, offerPer, durationInMilliseconds, imgSrc, productUri, copencode, store: `${store.charAt(0).toUpperCase()}${store.slice(1)}` });
                    }
                }
            }

            resolve({ success: true, offers, reachEnd: false });
        } catch (error) {
            reject(error)
        }
    })
}

async function ExtractOfferURL(dataCode) {
    try {
        if (!dataCode) { return }
        const userAgent = new UserAgent();
        const parsedUserAgent = userAgent.toString()
        const headers = { 'User-Agent': `${parsedUserAgent}` };

        const { request, data } = await axios.get(`https://www.dealsmagnet.com/buy?${dataCode}`, { headers })
        const redirectUri = request.res.responseUrl;
        return { Uri: redirectUri };
    } catch (error) {
        console.log(error)
        return { Uri: null, asin: null };
    }
}

function getStores() {
    const excludeStores = ['flipkart', 'amazon'];
    const otherStores = supportedStors.filter(item => !excludeStores.includes(item));
    return otherStores;
}
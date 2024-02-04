const { default: axios } = require("axios");
const Cheerio = require('cheerio');
const client = require("../database/redis");
const ms = require("ms");
const UserAgent = require("user-agents");
const fetchWithRetry = require("../utils/fetchWithretry");

async function GetAmazonOffers() {

    try {
        const prevUpdatedOffers = JSON.parse(await client.get("updated_AmazonOffers")) || [];
        const lastUpdatedOffer = prevUpdatedOffers[prevUpdatedOffers?.length - 1 || 0] || null
        const Alloffers = [];
        let page = 1
        while (true) {
            const userAgent = new UserAgent();
            const parsedUserAgent = userAgent.toString()
            const headers = { 'User-Agent': `${parsedUserAgent}` };
            const { data } = await fetchWithRetry({ url: `https://www.dealsmagnet.com/offers/amazon?page=${page}`, headers });
            const { success, reachEnd, offers } = await GetData(data, lastUpdatedOffer)
            if (success) {
                Alloffers.push(...offers)
                page++;
            }
            if (reachEnd) {
                break;
            }
        }
        return Alloffers;
    } catch (error) {
        throw error;
    }
}

module.exports = GetAmazonOffers;

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
                const productUri = await ExtractOfferURL(dataCode)
                if (durationInMilliseconds >= 86400000) {
                    resolve({ success: true, offers, reachEnd: true });
                    break;
                }
                if (store && store == 'amazon' && productUri.Uri) {
                    offers.push({ data: dataCode, valueofD, description, note, originalPrice, dealPrice, offerPer, durationInMilliseconds, imgSrc, productUri, copencode, store: `${store.charAt(0).toUpperCase()}${store.slice(1)}` });
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
        const { request } = await fetchWithRetry({ url: `https://www.dealsmagnet.com/buy?${dataCode}`, headers });

        const redirectUri = request.res.responseUrl;

        const urlParams = new URL(redirectUri);;
        urlParams.searchParams.delete("ascsubtag");
        urlParams.searchParams.delete("tag");
        urlParams.searchParams.delete("smid");
        const host = urlParams.host
        if (host != "www.amazon.in") return {}

        const newUrl = decodeURIComponent(urlParams.toString());
        const modifiedUrl = newUrl.replace(/dealsmagnet\.com\//, '');
        var asinPattern = /\/dp\/([A-Z0-9]{10})/;
        var asin = asinPattern.exec(request.res.responseUrl)[1];
        return { Uri: modifiedUrl, asin };

    } catch (error) {
        return { Uri: null, asin: null };
    }
}

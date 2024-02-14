const ms = require("ms");
const client = require('../database/redis');
const genarateEarnkaroLinkForProducts = require('../earnkaro/createlinkforAllproducts/genarateLinkForProducts');
const fetchWithRetry = require("../utils/fetchWithretry");

function GetAllOffers() {
    console.log('getting offers...')
    return new Promise(async (resolve, reject) => {
        const prevUpdatedOffers = JSON.parse(await client.get("updated_Offers")) || [];
        const lastUpdatedOffer = prevUpdatedOffers[prevUpdatedOffers?.length - 1 || 0] || null
        const Alloffers = [];
        let page = 1

        while (true) {
            try {
                const url = 'http://www.offertag.in/search';
                const parameters = { shops: ['amazon', 'flipkart', 'myntra'], deals: 3, q: '', page };
                const headers = { 'X-Requested-With': 'XMLHttpRequest' };

                const { data: { data } } = await fetchWithRetry({ url, method: 'GET', headers, params: { params: parameters } })
                const { success, reachEnd, offers } = await GetOffers(data, lastUpdatedOffer)

                if (success) {
                    Alloffers.push(...offers)
                    page++;
                }
                if (reachEnd) break;

            } catch (error) {
                console.log(error)
            }
        }
        const { amazoneOffers, otherAlloffers } = Alloffers.reduce((acc, cur) => {
            if (cur.store === 'Amazon') acc.amazoneOffers.push(cur);
            else acc.otherAlloffers.push(cur);
            return acc;
        }, { amazoneOffers: [], otherAlloffers: [] });

        const validAmazonOffers = await CreateAmazonOffers(amazoneOffers)
        const validOtherOffers = await CreateOtherOffers(otherAlloffers)
        const AllOffers = [...validAmazonOffers.ClassifiedOffers, ...validOtherOffers.ClassifiedOffers]
        const sortedOffers = AllOffers.sort((a, b) => b.updatedTimeinMilisecond - a.updatedTimeinMilisecond)
        resolve({ success: true, offers: sortedOffers })
    })
}

function GetOffers(Alldeals, lastUpdatedOffer) {
    return new Promise(async (resolve, reject) => {
        const offers = [];
        const lastUpdatedOfferId = lastUpdatedOffer || null
        const deals = Alldeals.original.deals.data

        for (let i = 0; i < deals.length; i++) {
            const deal = deals[i];
            const id = deal.id
            if (id == lastUpdatedOfferId) {
                resolve({ success: true, offers, reachEnd: true });
                break;
            }
            const discription = deal.title
            const category = { category_id: deal.category_id, category_name: deal.category_name }
            const store = deal.shop.name
            const mrp = deal.actual_amount
            const dealPrice = deal.discount_amount
            const discountPercentage = deal.discount_percent
            const imageSrc = `https://www.offertag.in/storage/deal/thumbnail/` + deal.image_name
            const dealLink = deal.clean_url
            const notes = (discription.match(/\[(.*?)\]/) || [])[1] || null
            const updatedTime = (deal.posted_date).replace('ago', '').trim()
            const updatedTimeinMilisecond = ms(updatedTime) || 0

            if (updatedTimeinMilisecond >= (1000 * 60 * 60 * 1)) {
                resolve({ success: true, offers, reachEnd: true });
                break;
            }

            if (id, discription, store, mrp, dealPrice, discountPercentage, imageSrc, dealLink, updatedTime, updatedTimeinMilisecond) {
                offers.push({ discription, id, category, store, mrp, dealPrice, discountPercentage, imageSrc, dealLink, notes, updatedTime, updatedTimeinMilisecond })
            }
        }
        resolve({ success: true, offers, reachEnd: false });
    })
}

function CreateAmazonOffers(offers) {
    return new Promise(async (resolve, reject) => {
        try {

            const { ClassifiedOffers } = await FilterAmazonOffers(offers)

            ClassifiedOffers.forEach((item, i) => {
                const url = item.dealLink
                const pid = url?.match(/\/dp\/([A-Z0-9]+)\b/i)?.[1] || null;
                if (pid) {
                    const urlObject = new URL(url);
                    const newPathname = urlObject.pathname.replace("/source=offertag.in", "");
                    const newUrl = `${urlObject.protocol}//${urlObject.host}${newPathname}`;
                    item.affliateLink = newUrl;
                } else {
                    const urlParams = new URL(url);
                    urlParams.searchParams.delete("ascsubtag");
                    urlParams.searchParams.delete("tag");
                    urlParams.searchParams.delete("smid");
                    const host = urlParams.host
                    if (host != "www.amazon.in") {
                        return item.affliateLink = null
                    }
                    const newUrl = decodeURIComponent(urlParams.toString());
                    const modifiedUrl = newUrl.replace("/source=offertag.in", "");
                    item.affliateLink = modifiedUrl;
                }
            })

            const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
            const filteredOffers = ClassifiedOffers.filter(offer => offer.affliateLink.match(urlRegex));
            resolve({ success: true, ClassifiedOffers: filteredOffers });
        } catch (error) {
            reject(error);
        }
    })
}

function CreateOtherOffers(offers) {
    return new Promise(async (resolve, reject) => {
        try {
            const { flipkartOffers, myntraoffers } = offers.reduce((acc, cur) => {
                if (cur.store === 'Flipkart') acc.flipkartOffers.push(cur);
                else if (cur.store === 'Myntra') acc.myntraoffers.push(cur);

                return acc;
            }, { flipkartOffers: [], myntraoffers: [] });

            const [ClassifiedMyntraOffers = [], ClassifiedFlipkartOffers = []] = await Promise.all([
                FilterMyntraOffers(myntraoffers),
                FilterFlipkartOffers(flipkartOffers)
            ])

            const AllClassifiedOffers = [...ClassifiedFlipkartOffers.ClassifiedOffers, ...ClassifiedMyntraOffers.ClassifiedOffers]
            if (AllClassifiedOffers.length > 0) {
                const LinkArray = AllClassifiedOffers.map(offer => offer.dealLink)
                const linkString = LinkArray.join('\n');
                const { data: { data: Uris }, status } = await genarateEarnkaroLinkForProducts(linkString)
                const uriarray = Uris.split('\n')
                uriarray.forEach((uri, i) => {
                    AllClassifiedOffers[i].affliateLink = uri
                });
            }
            resolve({ success: true, ClassifiedOffers: AllClassifiedOffers });
        } catch (error) {
            reject(error);
        }
    })
}

function FilterAmazonOffers(offers) {
    return new Promise(async (resolve, reject) => {
        const ClassifiedOffers = [];
        try {
            for (let i = 0; i < offers.length; i++) {
                const offer = offers[i];
                const { dealLink, store, dealPrice } = offer;
                const pid = dealLink?.match(/\/dp\/([A-Z0-9]+)\b/i)?.[1] || null;

                if (pid) {
                    const [priceHistory = []] = await getPriceHistory(pid, store.toLowerCase());
                    const { averageprice = 0, highprice = 0, lowestprice = 0 } = priceHistory;
                    const percentageDifference = +(((dealPrice - lowestprice) / ((dealPrice + lowestprice) / 2)) * 100).toFixed(2);

                    const lootDeal = dealPrice < lowestprice
                    const hotDeal = percentageDifference <= 10

                    if (lootDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 2, averageprice, highprice, lowestprice }); // loot deal
                    } else if (hotDeal && !lootDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 1, averageprice, highprice, lowestprice }); // Hot deal
                    } else if (!lootDeal && !hotDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 0, averageprice, highprice, lowestprice }); // Normal deal
                    }
                }
                else {
                    ClassifiedOffers.push({ ...offer, dealType: 3 }); // Multiple deals
                }
            }

            resolve({ success: true, ClassifiedOffers });
        } catch (error) {
            reject(error);
        }
    });
}

function FilterFlipkartOffers(offers) {
    return new Promise(async (resolve, reject) => {
        const ClassifiedOffers = [];
        try {
            for (let i = 0; i < offers.length; i++) {
                const offer = offers[i];
                const { dealLink, store, dealPrice } = offer;
                const urlParams = new URL(dealLink);
                const host = urlParams.host;
                let newDealLink;
                let pid;
                if (host !== 'fkrt.it') {
                    pid = urlParams.searchParams.get('pid') || null;
                    newDealLink = dealLink
                } else {
                    newDealLink = await GetFlipkartURL(dealLink)
                    pid = new URL(newDealLink).searchParams.get('pid') || null;
                }

                if (pid) {
                    const [priceHistory = []] = await getPriceHistory(pid, store.toLowerCase());
                    const { averageprice = 0, highprice = 0, lowestprice = 0 } = priceHistory;
                    const percentageDifference = +(((dealPrice - lowestprice) / ((dealPrice + lowestprice) / 2)) * 100).toFixed(2);

                    const lootDeal = dealPrice < lowestprice;
                    const hotDeal = percentageDifference <= 10;

                    if (lootDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 2, averageprice, highprice, lowestprice, dealLink: newDealLink }); // loot deal
                    } else if (hotDeal && !lootDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 1, averageprice, highprice, lowestprice, dealLink: newDealLink }); // Hot deal
                    } else {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 0, averageprice, highprice, lowestprice, dealLink: newDealLink }); // Normal deal
                    }
                } else {
                    ClassifiedOffers.push({ ...offer, dealType: 3, dealLink: newDealLink }); // Multiple deals
                }
            }
            resolve({ success: true, ClassifiedOffers });
        } catch (error) {
            reject(error);
        }
    });
}

function FilterMyntraOffers(offers) {
    return new Promise(async (resolve, reject) => {
        const ClassifiedOffers = []
        try {
            for (let i = 0; i < offers.length; i++) {
                const offer = offers[i];
                const { dealLink, store, dealPrice } = offer;
                const newDealLink = await GetMintraURL(dealLink)
                const pid = newDealLink.match(/\/(\d+)\/buy$/)?.[1] || null;

                if (pid) {
                    const [priceHistory = []] = await getPriceHistory(pid, store.toLowerCase());
                    const { averageprice = 0, highprice = 0, lowestprice = 0 } = priceHistory;
                    const percentageDifference = +(((dealPrice - lowestprice) / ((dealPrice + lowestprice) / 2)) * 100).toFixed(2);

                    const lootDeal = dealPrice < lowestprice
                    const hotDeal = percentageDifference <= 10

                    if (lootDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 2, averageprice, highprice, lowestprice, dealLink: newDealLink }); // loot deal
                    } else if (hotDeal && !lootDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 1, averageprice, highprice, lowestprice, dealLink: newDealLink }); // Hot deal
                    } else if (!lootDeal && !hotDeal) {
                        ClassifiedOffers.push({ ...offer, hotness: percentageDifference, dealType: 0, averageprice, highprice, lowestprice, dealLink: newDealLink }); // Normal deal
                    }
                } else {
                    ClassifiedOffers.push({ ...offer, dealType: 3, dealLink: newDealLink }); // Multiple deals
                }
            }

            resolve({ success: true, ClassifiedOffers });
        } catch (error) {
            reject(error);
        }
    });
}

async function getPriceHistory(pid, store) {
    const postData = `pid=${pid}&store=${store}`;

    try {
        const response = await fetchWithRetry({ url: 'https://api2.indiadesire.com/n/m/api.php?rquest=getProductPriceDataMN', method: "POST", data: postData });
        return response.data;
    } catch (error) {
        throw new Error('Error fetching price history: ' + error.message);
    }
}

async function GetMintraURL(origin) {
    try {
        const response = await fetchWithRetry({ url: origin });
        const finalRedirectedUrl = decodeURIComponent(response.request.res.responseUrl);
        return finalRedirectedUrl
    } catch (error) {
        throw new Error(error)
    }
}
async function GetFlipkartURL(origin) {
    try {
        const data = '\x0d\x0a\x0d\x0a';
        const response = await fetchWithRetry({ url: origin, data: data, })
        const finalRedirectedUrl = decodeURIComponent(response.request.res.responseUrl);
        return finalRedirectedUrl
    } catch (error) {
        throw new Error(error)
    }
}

module.exports = GetAllOffers;
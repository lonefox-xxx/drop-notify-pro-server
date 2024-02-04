const { default: axios } = require("axios");

async function ExtractOfferURL(dataCode) {
    if (!dataCode) { return }
    const { request } = await axios.get(`https://www.dealsmagnet.com/buy?${dataCode}`)
    const redirectUri = request.res.responseUrl;

    const urlParams = new URL(redirectUri);;
    urlParams.searchParams.delete("ascsubtag");
    urlParams.searchParams.delete("tag");

    const newUrl = decodeURIComponent(urlParams.toString());
    const modifiedUrl = newUrl.replace(/dealsmagnet\.com\//, '');
    console.log(redirectUri)
    return modifiedUrl;
}

module.exports = ExtractOfferURL;

function parseAmazonLinks(link) {
    const url = new URL(link);
    const pathSegments = url.pathname.split('/');
    const productCode = pathSegments[pathSegments.length - 1];
    console.log(productCode, link)
    return `https://www.amazon.in/dp/${productCode}`;
}
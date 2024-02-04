const { getParsedCokies } = require("../../helpers/handleCookie");
const ParserRequests = require("./parseRequests");
const cheerio = require('cheerio');

async function getallEarnkaroOffers() {
    try {
        const { success, error, cookies } = await getParsedCokies()
        if (!success) return reject(error)
        const url = 'https://earnkaro.com/product/trending-offers/best-deals-today';
        const headers = {
            'Host': 'earnkaro.com',
            'Cookie': `${cookies}`,
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.71 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Priority': 'u=0, i'
        };

        const res = await ParserRequests({ url, headers })
        const $ = cheerio.load(res.data);
        const scriptContent = $('#__NEXT_DATA__').html();;
        const jsonData = JSON.parse(scriptContent);

        return { data: jsonData, status: res.status }
    } catch (error) {
        return { data: null, error }
    }
}

module.exports = getallEarnkaroOffers

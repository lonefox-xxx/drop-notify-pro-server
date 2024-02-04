const { clearAllCookies } = require('../../helpers/handleCookie');
const ParserRequests = require('./parseRequests');

function InitialReq() {

    return new Promise(async (resolve, reject) => {
        try {
            const config = {
                method: 'get',
                url: 'https://earnkaro.com/',
                headers: {
                    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-User': '?1',
                    'Sec-Fetch-Dest': 'document',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Priority': 'u=0, i',
                    'Connection': 'close',
                },
            };
            await clearAllCookies()
            const res = await ParserRequests({ url: config.url, headers: config.headers })
            resolve(res)
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = InitialReq
const { getParsedCokies } = require("../../helpers/handleCookie");
const ParserRequests = require("./parseRequests");

function Requestotp(crsf, phone) {
    return new Promise(async (resolve, reject) => {

        try {
            const { success, error, cookies } = await getParsedCokies()
            if (!success) return reject(error)
            const url = 'https://earnkaro.com/pps/user/validation?otpBy=sms&action=loginotp';
            const headers = {
                'Host': 'earnkaro.com',
                'Cookie': `${cookies}`,
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Csrf-Token': `${crsf}`,
                'Sec-Ch-Ua-Mobile': '?0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.216 Safari/537.36',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Origin': 'https://earnkaro.com',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://earnkaro.com/login',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'Priority': 'u=1, i',
            };

            const data = {
                "username": phone,
                "mode": "EmailForm",
                "captcha_code": ""
            };

            const res = await ParserRequests({ url, headers, method: 'POST', additional: { data } })
            resolve(res)

        } catch (error) {
            reject(error)
        }
    })

}

module.exports = Requestotp;
const axios = require("axios");
const { SaveCookies } = require("../../helpers/handleCookie");

async function ParserRequests({ url, method = 'GET', headers = {}, body = {}, additional = {} }) {
    const config = {
        method: method,
        url: url,
        headers: headers,
        ...additional
    };

    try {
        const res = await axios(config);
        await SaveCookies(res.headers['set-cookie']);
        return res;
    } catch (error) {
        // Handle errors if needed
        console.error(error);
        throw error;
    }
}

module.exports = ParserRequests;

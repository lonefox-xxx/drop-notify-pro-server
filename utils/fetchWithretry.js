const axios = require('axios');
const UserAgent = require("user-agents");
const http = require('http');
const https = require('https');
const { default: axiosRetry } = require('axios-retry');


async function fetchWithRetry({ url, maxRetries = 5, initialTimeout = 10000, data = '', headers = {}, method = 'GET', params = {}, proxy = true }) {
    const userAgent = new UserAgent().toString();
    const httpAgent = new http.Agent({ keepAlive: true });

    const instance = axios.create({
        httpAgent,
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    axiosRetry(instance, {
        retries: maxRetries,
        retryDelay: (retryCount) => Math.min(initialTimeout * Math.pow(2, retryCount), 10000),
    });

    try {
        const response = await instance.request({
            url,
            method,
            data,
            headers: { userAgent, ...headers },
            timeout: initialTimeout,
            ...params
        });
        return response;
    } catch (error) {
        throw error;
    }
}

module.exports = fetchWithRetry;

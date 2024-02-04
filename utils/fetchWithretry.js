const { default: axios } = require("axios");

function fetchWithRetry({ url, maxRetries = 5, initialTimeout = 10000, data = '', headers = {}, method = 'GET', params = {}, proxy = true }) {
    return new Promise(async (resolve, reject) => {
        let retryCount = 0;
        let timeout = initialTimeout;
        while (retryCount < maxRetries) {
            try {
                const response = await axios[method.toLowerCase()](url, {
                    method: 'GET',
                    data,
                    headers,
                    proxy: {
                        host: 'proxy-server.scraperapi.com',
                        port: 8001,
                        auth: {
                            username: 'scraperapi',
                            password: '61e8b8912849e154d57583fd2e274a7d'
                        },
                        protocol: 'http'
                    },
                    ...params
                });
                return resolve({ success: true, data: response, status: response.status });
            } catch (error) {
                retryCount++;
                timeout = Math.min(timeout * 2, 10000);
            }
        }
        console.log('Request failed after max retries');
        return resolve({ success: false, data: null });
    });
}

module.exports = fetchWithRetry;

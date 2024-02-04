const axios = require("axios");

async function getProxy(cn = 'all') {
    try {
        const { data: { proxies = [] } } = await axios.get(`https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&country=${cn}&timeout=15000&proxy_format=ipport&format=json`);
        const shuffledProxies = proxies.sort(() => Math.random() - 0.5);
        const { ip: host, port, proxy, protocol, ip_data: { countryCode: country } } = shuffledProxies[Math.floor(Math.random() * shuffledProxies.length)];
        return { host, port, country, proxy, protocol };
    } catch (error) {
        throw error;
    }
}

module.exports = getProxy;

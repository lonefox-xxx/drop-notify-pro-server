const client = require("../database/redis");

async function SaveCookies(cookieArray) {
    try {
        const isCookiesValid = !cookieArray || cookieArray.length > 0
        if (!isCookiesValid) return { success: false, msg: 'invalid cookies' }

        const cookies = await getCookies()
        cookieArray.forEach(element => {
            const cookie = element.split(';')[0]
            const key = cookie.split('=')[0]
            const value = cookie.split('=')[1]
            if (value != '') cookies[key] = value
        });

        await client.set('cookies', JSON.stringify(cookies))
        return { success: true }
    } catch (error) {
        return { success: false, msg: error }
    }
}

async function clearAllCookies() {
    return await client.del('cookies')
}

async function getCookies() {
    const cookiesJson = await client.get('cookies');
    if (!cookiesJson) return {};

    try {
        const cookies = JSON.parse(cookiesJson);
        return cookies || {};
    } catch (error) {
        return {};
    }
}

async function getParsedCokies() {
    try {
        const cookies = await getCookies()
        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');

        return { success: true, cookies: cookieString.trim() || '' }
    } catch (error) {
        return { success: false, error }
    }
}

module.exports = { SaveCookies, clearAllCookies, getCookies, getParsedCokies }
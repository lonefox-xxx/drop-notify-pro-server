const client = require("../../database/redis");

async function saveDetials(detials) {
    if (!detials) return false
    const d = await client.set('detials', JSON.stringify(detials || {}))
    return d;
}

async function getDetials() {
    const detials = JSON.parse(await client.get('detials')) || null
    return detials;
}

module.exports = { saveDetials, getDetials }
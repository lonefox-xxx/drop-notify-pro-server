const Database = require("../database/database");
const db = new Database();

async function FetchAllOffers(req, res) {
    try {
        let { stores = null, categorys = null, type = null, page = 1, pageSize = 50 } = req.query;

        categorys = categorys?.split(',');
        stores = stores?.split(',');

        let query = {};

        if (stores && stores.length > 0) query.store = { $in: stores };
        if (categorys && categorys.length > 0) query['category.category_name'] = { $in: categorys };
        if (type) query.dealType = +type;

        const skips = (page - 1) * pageSize;

        const { success, data } = await db.getLogs(query, 'deals', { created: -1 }, pageSize, skips);
        res.send({ success, data });
    } catch (error) {
        console.error(error);
        res.send({ success: false, error: 'something went wrong' });
    }
}

module.exports = FetchAllOffers;

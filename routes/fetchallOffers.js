const Database = require("../database/database");
const db = new Database();

async function FetchAllOffers(req, res) {
    try {
        let { stores = null, categorys = null, type = null, page = 1, pageSize = 50 } = req.query;

        if (categorys && categorys != 'all') categorys = categorys?.split(',');
        if (stores && stores != 'all') stores = stores?.split(',');

        let query = {};

        if (stores && stores.length > 0 && stores != 'all') query.store = { $in: stores };
        if (categorys && categorys.length > 0 && categorys != 'all') query['category.category_name'] = { $in: categorys };
        if (type && type != 'all') query.dealType = +type;

        // console.log(query)
        const skips = (page - 1) * +pageSize;

        const { success, data } = await db.getLogs(query, 'deals', { created: -1 }, +pageSize, skips);
        res.send({ success, data });
    } catch (error) {
        console.error(error);
        res.send({ success: false, error: 'something went wrong' });
    }
}

module.exports = FetchAllOffers;

const Database = require("../database/database")
const db = new Database()

async function GetAlert(req, res) {
    const { id } = req.query

    if (!id) return res.send({ sucess: false, msg: 'invalid params' })

    const { data } = await db.getLogs({ id }, 'User_alerts')
    delete data[0]?._id
    res.send({ sucess: true, data: data[0] })
}

module.exports = GetAlert;
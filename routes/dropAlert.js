const Database = require("../database/database")
const db = new Database()

async function DropAlert(req, res) {
    const { id } = req.query
    await db.clearLogs({ id }, 'User_alerts')
    res.send({ sucess: true, msg: 'Alert deleted' })
}

module.exports = DropAlert;
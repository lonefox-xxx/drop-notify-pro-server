const Database = require("../database/database")
const db = new Database()
const crypto = require('crypto')
async function SaveAlert(req, res) {
    const { phone, email, categorys, id: alertid = null } = req.body

    if ((!phone && !email) || !categorys) return res.send({ sucess: false, msg: 'invalid params' })

    const id = alertid ? alertid : crypto.randomBytes(12).toString('hex')
    const createdat = new Date().getTime()
    await db.updateLog({ id: { id }, data: { createdat, phone, email, categorys } }, 'User_alerts', true)
    res.send({ sucess: true, msg: 'alert setup completed', data: { id, createdat, phone, email, categorys } })
}

module.exports = SaveAlert;
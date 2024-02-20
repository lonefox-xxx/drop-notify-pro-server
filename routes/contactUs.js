const Database = require("../database/database");
const db = new Database()

async function ContactUs(req, res) {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) return res.send({ success: false, msg: 'Name, Email, Subject and Message are required', status: 400 })

    await db.addLogs({ name, email, subject, message, createdat: new Date().getTime() }, 'User_messages')
    res.send({ success: true, msg: 'Message sent successfully', status: 200 })
}

module.exports = ContactUs;
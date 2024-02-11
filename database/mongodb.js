const { MongoClient } = require("mongodb")
const Database = require('./database')
const db = new Database()

var database

const mongoUser = process.env.MONGO_USER
const monogPass = process.env.MONGO_PASS
const mongodb = process.env.MONGO_DB

MongoClient.connect(`mongodb+srv://${mongoUser}:${monogPass}@cluster0.ywsn7md.mongodb.net/`, { useNewUrlParser: true }, (err, result) => {
    if (err) throw err
    database = result.db(mongodb)
    db.setDB(database)
})
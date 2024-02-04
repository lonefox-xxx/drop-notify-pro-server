const sqlite3 = require("sqlite3").verbose();
var path = require("app-root-path");

class localDatabase {
    constructor(tableName) {
        this.db = new sqlite3.Database(path.resolve("./localDatabase.db"));
        this.tableName = tableName;
        this.createTable();
    }

    async createTable() {
        const sql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (key TEXT PRIMARY KEY, value TEXT)`;
        return await new Promise((resolve, reject) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error("Error creating table:", err);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    insertValue(key, value) {
        const sql = `INSERT INTO ${this.tableName} (key, value) VALUES (?, ?)`;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [key, value], (err) => {
                if (err && err.errno === 19) {
                    this.updateValue(key, value)
                        .then(() => resolve(true))
                        .catch((err) => reject(err));
                } else if (err && err.errno === 1) {
                    this.createTable();
                    // reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    getValue(key) {
        const sql = `SELECT value FROM ${this.tableName} WHERE key = ?`;
        return new Promise((resolve, reject) => {
            this.db.get(sql, [key], (err, row) => {
                if (err && err.errno === 1) {
                    this.createTable().then(() => {
                        this.getValue(key).then(resolve).catch(reject);
                    });
                } else {
                    resolve(row ? row.value : false);
                }
            });
        });
    }

    getAllValue() {
        const sql = `SELECT * FROM tradeProperties`;
        return new Promise((resolve, reject) => {
            this.db.all(sql, (err, rows) => {
                if (err) {
                    console.error("Error getting all values:", err);
                    reject(err);
                } else {
                    console.log(JSON.stringify(rows));
                    return resolve(rows);
                }
            });
        });
    }

    updateValue(key, newValue) {
        const sql = `UPDATE ${this.tableName} SET value = ? WHERE key = ?`;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [newValue, key], (err) => {
                if (err) {
                    console.error("Error updating value:", err);
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            });
        });
    }

    clearTable() {
        const sql = `DELETE FROM ${this.tableName}`;
        return new Promise((resolve, reject) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error("Error clearing table:", err);
                    reject(err);
                } else {
                    resolve(true);
                    console.log("cleared");
                }
            });
        });
    }

    deleteValue(key) {
        const sql = `DELETE FROM ${this.tableName} WHERE key = ?`;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [key], function (err) {
                if (err) {
                    console.error("Error deleting value:", err);
                    reject(err);
                } else {
                    resolve(true);
                    // console.log('deleted');
                }
            });
        });
    }

    deleteTable() {
        const sql = `DROP TABLE IF EXISTS ${this.tableName}';`;
        this.db.run(sql, (err) => {
            !err ? console.log("table deleted") : err;
        });
    }
}

module.exports = localDatabase;
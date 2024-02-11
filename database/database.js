let database

class Database {

    setDB(db) {
        database = db;
        console.log('database setup complete');
    }

    async updateLog(body, collectionName, upsert = true) {
        try {
            const { data = {}, id = {} } = body;
            const collection = database.collection(collectionName);
            const result = await collection.updateMany(id, { $set: data }, { upsert: upsert });
            return result;
        } catch (error) {
            console.error('Error updating log:', error);
            throw error;
        }
    }

    async getLogs(id = {}, collectionName, sort = {}, limit = 100) {
        try {
            const collection = database.collection(collectionName);
            const data = await collection.find(id).sort(sort).limit(limit).toArray();
            return data ? { success: true, data } : { success: false, data: {} };
        } catch (error) {
            console.error('Error getting logs:', error);
            throw error;
        }
    }

    async addLogs(body, collectionName) {
        const data = body ?? {};
        const collection = database.collection(collectionName);
        const res = await collection.insertOne(data);
        return res;
    }

    async clearLogs(body, collectionName) {
        const data = body.data ?? {};
        const res = await database.collection(collectionName).deleteMany(data);
        return res;
    }

    async createCollection(collectionName) {
        return await database.createCollection(collectionName);
    }
}

module.exports = Database;

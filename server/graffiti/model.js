const db = require('../db');
const name = 'graffiti';

async function get() {
    return db.collection(name).findOne({});
}

async function update(params) {
    await db.collection(name).deleteMany({});
    await db.collection(name).insertOne({
        dataUrl: params.dataUrl
    });
    return get();
}

module.exports = {
    name,
    get,
    update
}
const { ObjectID } = require('mongodb');
const util = require('../util');
const db = require('../db');
const { randAlphanum } = require('../rand');

const name = 'ly';

// const get = util.genGet(name);
async function get(hash) {
    // console.log(hash, { hash });
    let result = await db.collection(name).findOne({ hash });
    // console.log(result);
    return db.collection(name).findOne({ hash });
}

async function create(params) {
    let hash = params.hash || randAlphanum(7);
    let existing = await get(hash);
    if (existing) {
        console.log(hash, existing);
        throw new Error(`Hash ${hash} already exists`);
    }

    let result = await db.collection(name).insertOne({
        hash,
        links: params.links,
    });
    // console.log(result);
    // console.log(get(hash));
    return get(hash);
}

async function update(id, ly) {
    ly._id = ObjectID(ly._id);
    return db.collection(name).replaceOne(
        { _id: ObjectID(id) },
        { $set: ly }
    );
}

module.exports = {
    name,
    get,
    create,
    update,
}
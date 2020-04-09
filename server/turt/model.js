const { ObjectID } = require('mongodb');
const util = require('../util');
const db = require('../db');

const name = 'turt';

async function random(count) {
    return db.collection(name).aggregate([
        { "$sample": { "size": count } }
    ]).toArray();
}

const get = util.genGet(name);

async function create(params) {
    let result = await db.collection(name).insertOne({
        content: params.content,
        author: params.author
    });
    return get(result.insertedId);
}

async function update(id, updatedTurt) {
    updatedTurt._id = ObjectID(updatedTurt._id);
    return db.collection(name).replaceOne(
        { _id: ObjectID(id) },
        { $set: updatedTurt }
    );
}

module.exports = {
    name,
    get,
    create,
    update,
    random
}
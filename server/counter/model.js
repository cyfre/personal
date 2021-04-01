const db = require('../db');
const { entryMap } = require('../util');

const names = {
    counter: 'counter',
        // space: string
        // key: string
        // value: number
}
const C = entryMap(names, name => () => db.collection(name));

async function get(space, key) {
    return await C.counter().find({ space, key }).project({_id:0}).next() || { space, key, value: 0 }
}
async function shift(space, key, amount) {
    let counter = await get(space, key)
    counter.value += amount
    C.counter().updateOne({ space, key }, { $set: counter }, { upsert: true })
    return counter;
}

module.exports = {
    names,
    get,
    shift,
}
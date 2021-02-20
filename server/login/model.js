const { ObjectID } = require('mongodb');
const util = require('../util');
const db = require('../db');
const crypto = require('crypto');
const uuid = require('uuid');

const name = 'login';
const genToken = () => uuid.v4();
const userAndToken = entry => entry ? { user: entry.user, token: entry.token } : {};
/* login
user: string
pass: hash
token: uuid
*/

async function get(user) {
    return db.collection(name).findOne({ user });
}

async function _update(entry) {
    console.log(entry);
    return db.collection(name).updateOne(
        { _id: ObjectID(entry._id) },
        { $set: entry },
        { upsert: true },
    );
}

async function login(user, passHash) {
    let entry = await get(user);
    console.log(entry);
    if (entry && entry.pass === passHash) {
        // entry.token = genToken();
        await _update(entry);
        return userAndToken(entry);
    }
    return { error: entry ? 'incorrect password' : "user doesn't exist" };
}

async function signup(user, passHash) {
    let entry = await get(user);
    if (await get(user)) return { error: 'user already exists' };

    entry = {
        user,
        pass: passHash,
        token: genToken(),
    }
    console.log(entry);
    await db.collection(name).insertOne(entry);
    return userAndToken(entry);
}

async function check(user, token) {
    let entry = await get(user);
    // console.log(user, entry && entry.token, token);
    return { ok: entry && entry.token === token };
}


async function changePass(user, currPass, newPass) {
    let entry = await get(user);
    if (entry && entry.pass === currPass) {
        entry.pass = newPass;
        entry.token = genToken();
        _update(entry);
        return userAndToken(entry);
    }
    return { error: entry ? 'incorrect password' : "user doesn't exist" };
}

module.exports = {
    name,
    get,
    login,
    signup,
    check,
    changePass,
}
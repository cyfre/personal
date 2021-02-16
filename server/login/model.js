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

async function _get(user) {
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
    let entry = await _get(user);
    console.log(entry);
    if (entry && entry.pass === passHash) {
        entry.token = genToken();
        await _update(entry);
        return userAndToken(entry);
    }
    return { error: entry ? 'incorrect password' : 'user DNE' };
}

async function signup(user, passHash) {
    await db.collection(name).deleteMany({ user });
    let entry = await _get(user);
    if (await _get(user)) return false;

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
    let entry = await _get(user);
    return { ok: entry && entry.token === token };
}


async function changePass(user, currPass, newPass) {
    let entry = await _get(user);
    if (entry && entry.pass === currPass) {
        entry.pass = newPass;
        entry.token = genToken();
        _update(entry);
        return userAndToken(entry);
    }
    return { error: entry ? 'incorrect password' : 'user DNE' };
}

module.exports = {
    name,
    login,
    signup,
    check,
    changePass,
}
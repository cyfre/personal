const util = require('../util');
const db = require('../db');
const { send } = require('../mail');

const name = 'msg';

const get = util.genGet(name);

async function create(params) {
    const msg = {
        content: params.body.content,
        contact: params.body.contact,
    }
    const result = await db.collection(name).insertOne(msg);
    send(
        'cyrus@freshman.dev',
        'cyrus@freshman.dev',
        'msg' + (msg.contact.length ? ' from ' + msg.contact : ''),
        `${msg.content}\n\n${msg.contact}`,
    );
    return get(result.insertedId);
}

module.exports = {
    name,
    create,
}
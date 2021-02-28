const { ObjectID } = require('mongodb');
const util = require('../util');
const db = require('../db');
const { entryMap } = require('../util');
const { randAlphanum } = require('../rand');

const names = {
    ly: 'ly',
        // user: string
        // hash: string
        // isPublic: boolean
        // links: string[]
}
const C = entryMap(names, name => () => db.collection(name));

async function _get(hash) {
    let ly = await C.ly().findOne({ hash })
    return ly
}
async function _update(user, hash, props) {
    if (props.hash && hash !== props.hash)
        throw new Error(`${props.hash} can't update /ly/${hash}`)
    let ly = (await _get(hash)) || { user, hash }
    if (ly.user && ly.user !== user)
        throw new Error(`/ly/${hash} already exists`)
    ly.user = user
    Object.assign(ly, props)
    C.ly().updateOne({ hash }, { $set: ly }, { upsert: true })
    return ly;
}

async function getUser(user) {
    let list = await C.ly().find({ user }).toArray()
    return { list }
}
async function get(user, hash) {
    let ly = await _get(hash)
    console.log(ly)
    // if (ly && !ly.isPublic && ly.user !== user)
    //     throw new Error(`/ly/${hash} is private`)
    return { ly }
}
async function create(user, params) {
    let hash = params.hash || randAlphanum(7)
    let existing = await _get(hash)
    if (existing)
        throw new Error(`/ly/${hash} already exists`)
    return {
        ly: await _update(user, hash, params)
    }
}
async function update(user, hash, params) {
    let { links, isPublic } = params
    return {
        ly: await _update(user, hash, {
            links,
            isPublic
        })
    }
}
async function remove(user, hash) {
    return {
        ly: await _update(user, hash, { user: undefined })
    }
}

module.exports = {
    names,
    getUser,
    get,
    create,
    update,
    remove,
}
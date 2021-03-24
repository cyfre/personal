const { ObjectID } = require('mongodb');
const util = require('../util');
const db = require('../db');
const { entryMap } = require('../util');
const { randAlphanum } = require('../rand');

const names = {
    tally: 'tally',
        // user: string
        // terms: { [term]: { t: number }[] }
        // color: { [term]: string }
}
const C = entryMap(names, name => () => db.collection(name));

async function _get(user) {
    let profile = await C.tally().findOne({ user }) || {
        user,
        terms: {}
    }
    return profile
}
async function _update(props) {
    let tally = (await _get(props.user)) || props
    props.terms = Object.assign(tally.terms || {}, props.terms || {})
    Object.keys(props.terms).forEach(term => {
        if (!props.terms[term]) delete props.terms[term]
    })
    Object.assign(tally, props)
    C.tally().updateOne({ user: props.user }, { $set: tally }, { upsert: true })
    return tally;
}

async function get(user) {
    return {
        tally: await _get(user)
    }
}
async function create(user, term) {
    let tally = await _get(user)
    if (!tally.terms[term]) {
        tally.terms[term] = []
    }
    return { tally }
}
async function update(user, params) {
    if (params.user && params.user !== user) throw Error(`users mismatch`)
    params.user = user
    return {
        tally: await _update(params)
    }
}
async function tally(user, term, time) {
    time = Number(time)
    let tally = await _get(user)
    if (!tally.terms[term]) {
        tally.terms[term] = []
    }
    if (tally.terms[term].find(entry => entry.t === time)) {
        tally.terms[term] = tally.terms[term].filter(entry => entry.t !== time)
    } else {
        tally.terms[term].push({
            t: time
        })
    }
    _update(tally)
    return { tally }
}
async function remove(user, term) {
    let tally = await _get(user)
    tally.terms[term] = undefined
    _update(tally)
    return { tally }
}
async function rename(user, term, to) {
    let tally = await _get(user)
    if (!tally.terms[to]) {
        tally.terms[to] = tally.terms[term]
        tally.terms[term] = undefined
    }
    _update(tally)
    return { tally }
}

module.exports = {
    names,
    get,
    create,
    update,
    tally,
    remove,
    rename,
}
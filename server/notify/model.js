const db = require('../db');
const { entryMap, remove } = require('../util');
const login = require('../login').model;

const names = {
    notify: 'notify',
        // user: string
        // twitter: string
        // apps: string[]
        // msg: { [app]: string[] }
}
const C = entryMap(names, name => () => db.collection(name));

async function get(user) {
    let notify = await C.profile().findOne({ user });
    if (!notify) {
        if (await login.get(user)) {
            notify = { user, handle: '', apps: [], msg: [], };
            C.profile().insertOne(notify);
        }
    }
    return { notify }
}
async function update(user, props) {
    if (user !== props.user)
        throw new Error(`${props.user} can't update ${user}`)
    let { notify } = await get(user);
    Object.assign(notify, props);
    C.profile().updateOne({ user }, { $set: props });
    return { notify };
}

async function twitter(user, _handle) {
    let handle = _handle || false
    return update(user, { handle })
}

async function sub(user, app, _set) {
    let { notify } = await get(user)
    let set = _set ?? notify.apps.includes(app)
    if (_set !== undefined) {
        let apps = _set
            ? [app].concat(notify.apps)
            : remove(notify.apps, app)
        notify = update(user, { apps })
    }
    return { set, notify }
}

async function read(user, _app) {
    let { notify } = await get(user)
    let { msg } = notify
    let clearedMsg = {}
    if (_app !== undefined) {
        clearedMsg = Object.assign({}, msg)
        msg = { [_app]: msg[_app] }
        delete clearedMsg[_app]
    }
    update(user, { msg: clearedMsg })
    console.log(msg)
    return { msg }
}
async function send(user, app, text) {
    let { notify } = await get(user)
    let { msg } = notify
    msg[app] = (msg[app] || []).concat(text)
    update(user, { msg })

     // will notify if not read & cleared within 10s
    setTimeout(async () => {
        let { notify } = await get(user)
        let { msg } = notify

        let appMsg = msg[app] || []
        if (appMsg.includes(text)) {
            console.log('NOTIFY', user, app, text)
            msg[app] = remove(appMsg, text)
            update(user, { msg })
        }
    }, 10000)

    return { msg }
}


module.exports = {
    names,
    get,
    twitter,

    sub,
    read,
    send,
}
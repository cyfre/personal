const db = require('../db');
const { entryMap, remove } = require('../util');
const login = require('../login').model;
const mail = require('../mail');
const { randAlphanum } = require('../rand');

const names = {
    notify: 'notify',
        // user: string
        // email: string
        // verify: string
        // verified: string[]
        // emailThread: string
        // apps: string[] (deprecated, use !unsub so true by default)
        // unsub: string[]
        // msg: { [app]: string[] }
}
const C = entryMap(names, name => () => db.collection(name));

const alwaysAllowed = 'verify u profile reset'.split(' ')

async function _chain(notify, app, text) {
    if (notify.emailThread) {
        console.log('[CHAIN]', notify.user, app, text)
        mail.chain(notify.emailThread, text)
    } else {
        console.log('[EMAIL]', notify.user, app, text)
        mail.send(notify.email, 'freshman.dev', text)
            .then(res => {
                console.log('[THREAD]', notify.user, res.data.id)
                update(notify.user, { emailThread: res.data.id })
            })
            .catch(console.log)
    }
}

async function get(user) {
    let notify = await C.notify().findOne({ user });
    if (!notify) {
        if (await login.get(user)) {
            notify = { user, email: '', apps: [], msg: [], };
            C.notify().insertOne(notify);
        }
    }
    return { notify }
}
async function update(user, props) {
    if (props.user && user !== props.user)
        throw new Error(`${props.user} can't update ${user}`)
    let { notify } = await get(user);
    Object.assign(notify, props);
    C.notify().updateOne({ user }, { $set: props });
    return { notify };
}

async function email(user, _email) {
    let { notify } = await get(user)
    let verified = notify.verified || (notify.verify ? [] : [notify.email])
    let email = _email || false
    let verify = (email && !verified.includes(email)) ? randAlphanum(7) : false
    notify = (await update(user, { email, verified, verify, emailThread: undefined })).notify
    verify && _chain(notify, 'notify', `verify email – freshman.dev/notify/#${verify}`)
    return { notify }
}
async function verify(token) {
    let notify = await C.notify().findOne({ verify: token });
    if (notify) {
        notify = (await update(notify.user, {
            verify: undefined,
            verified: [notify.email].concat(notify.verified)
        })).notify
    }
    return { notify }
}
async function twitter(user, _handle) {
    let handle = _handle || false
    return update(user, { handle })
}

async function sub(user, app, _set) {
    let { notify } = await get(user)
    let set
    if (_set !== undefined) {
        set = _set
        let unsub = _set
            ? remove(notify.unsub || [], app)
            : [app].concat(notify.unsub || [])
        notify = update(user, { unsub })
    } else {
        set = !(notify.unsub || []).includes(app)
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
    return { msg }
}

async function send(user, app, text) {
    let { notify } = await get(user)
    let { msg } = notify
    msg[app] = (msg[app] || []).concat(text)
    update(user, { msg })

    console.log('SEND', user, app, text)
    // will notify if not read & cleared within 10s
    console.log(notify.email, !notify.verify,
        notify.apps.concat(alwaysAllowed).includes(app))
    if (notify.email && !notify.verify &&
        notify.apps.concat(alwaysAllowed).includes(app)) {

        setTimeout(async () => {
            let { notify } = await get(user)
            let { msg } = notify

            let appMsg = msg[app] || []
            if (appMsg.includes(text)) {
                msg[app] = remove(appMsg, text)
                update(user, { msg })
                _chain(notify, app, text)
            }
        }, 10000)
    }

    return { msg }
}


module.exports = {
    names,
    get,
    email,
    verify,

    sub,
    read,
    send,
}
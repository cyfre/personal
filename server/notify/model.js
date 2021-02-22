const db = require('../db');
const { entryMap, remove } = require('../util');
const login = require('../login').model;
const mail = require('../mail');

const names = {
    notify: 'notify',
        // user: string
        // email: string
        // emailThread: string
        // twitter: string
        // apps: string[]
        // msg: { [app]: string[] }
}
const C = entryMap(names, name => () => db.collection(name));

const alwaysAllowed = 'reset'.split(' ')

async function get(user) {
    let notify = await C.notify().findOne({ user });
    if (!notify) {
        if (await login.get(user)) {
            notify = { user, handle: '', apps: [], msg: [], };
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
    let email = _email || false
    return update(user, { email, emailThread: undefined })
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
        let apps = _set
            ? [app].concat(notify.apps)
            : remove(notify.apps, app)
        notify = update(user, { apps })
    } else {
        set = notify.apps.includes(app)
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
    if (notify.email &&
        notify.apps.concat(alwaysAllowed).includes(app)) {

        setTimeout(async () => {
            let { notify } = await get(user)
            let { msg } = notify

            let appMsg = msg[app] || []
            if (appMsg.includes(text)) {
                msg[app] = remove(appMsg, text)
                update(user, { msg })

                if (notify.emailThread) {
                    console.log('CHAIN', user, app, text)
                    mail.chain(notify.emailThread, text)
                } else {
                    console.log('EMAIL', user, app, text)
                    mail.send(notify.email, 'freshman.dev', text)
                        .then(res => {
                            console.log('THREAD', res.data.id)
                            update(user, { emailThread: res.data.id })
                        })
                        .catch(console.log)
                }
            }
        }, 10000)
    }

    return { msg }
}


module.exports = {
    names,
    get,
    email,
    twitter,

    sub,
    read,
    send,
}
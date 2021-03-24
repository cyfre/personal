const { ObjectID } = require('mongodb');
const util = require('../util');
const db = require('../db');
const { entryMap } = require('../util');
const { randAlphanum } = require('../rand');
const ioM = require('../io')

const names = {
    user: 'chat-user',
        // user: string
        // chats: string[]
        // dms: { user: string }
        // unread: { string: number }
    chat: 'chat'
        // hash: string
        // users: string[]
        // messages { text: string, meta: { t: number }}
}
const C = entryMap(names, name => () => db.collection(name));

async function _get(hash) {
    let chat = await C.chat().findOne({ hash })
    // chat.messages = chat.messages.slice(0, 74)
    // C.chat().updateOne({ hash }, { $set: chat })
    return chat
}
async function _getUser(user) {
    // await C.user().updateMany({}, { $set: { unread: {} } });
    return (await C.user().findOne({ user })) || {
        user,
        chats: [],
        dms: {},
        unread: {},
    }
}
async function _putUser(props) {
    await C.user().updateOne({ user: props.user }, { $set: props }, { upsert: true });
}

async function getUser(user) {
    let chatUser = await _getUser(user)
    return {
        chatUser
    }
}

async function getUserChat(user, other) {
    let chatUser = await _getUser(user)
    let hash = chatUser.dms[other]
    let chat
    if (hash) {
        chat = await _get(hash)
    }
    if (!chat) {
        hash = hash || randAlphanum(7)
        chat = {
            hash,
            users: [user, other],
            messages: []
        }
        let chatOther = await _getUser(other)
        chatUser.dms[other] = hash
        chatOther.dms[user] = hash
        _putUser(chatUser)
        _putUser(chatOther)
        C.chat().insertOne(chat);
    }
    return { chat, chatUser }
}
async function readUserChat(user, other) {
    let { chat, chatUser } = await getUserChat(user, other)
    chatUser.unread && delete chatUser.unread[chat.hash]
    _putUser(chatUser)
    ioM.send(user, 'chat:unread', chatUser.unread)
    return { chat, chatUser }
}
async function sendUserChat(user, other, messages) {
    let { chat, chatUser } = await getUserChat(user, other)
    messages = messages.map(({ text, meta }) => {
        meta = meta || {}
        meta.t = Date.now()
        meta.user = user
        return { text, meta }
    })
    chat.messages = chat.messages.concat(messages)
    C.chat().updateOne({ hash: chat.hash }, { $set: chat }, { upsert: true });
    ioM.send([user, other], "chat:update", chat.hash, messages)
    let unread = messages.reduce((acc, msg) => acc + (msg.meta.read ? 0 : 1), 0)
    if (unread) {
        let chatOther = await _getUser(other)
        console.log(chatOther)
        if (!chatOther.unread) chatOther.unread = {}
        if (!chatOther.unread[chat.hash]) {
            chatOther.unread[chat.hash] = unread
            ioM.send(other, 'chat:unread', chatOther.unread)
        } else {
            chatOther.unread[chat.hash] += unread
        }
        _putUser(chatOther)
    }
    return { chat, chatUser }
}


async function newChat(users, hash) {
    if (hash) {
        if (await _get(hash)) throw Error(`/chat/${hash} already exists`)
    } else do {
        hash = randAlphanum(7)
    } while (await _get(hash))

    let chat = {
        hash,
        users,
        messages: []
    }
    await C.chat().insertOne(chat);
    console.log('[CHAT:new]', hash, users, chat)
    return { chat }
}
async function getChat(user, hash) {
    let chat = await _get(hash)
    if (chat && !chat.users.includes(user)) throw Error(`${user} can't view /chat/${hash}`)
    return { chat }
}
async function readChat(user, hash) {
    let { chat } = await getChat(user, hash)
    return { chat }
}
async function sendChat(user, hash, messages) {
    let { chat } = await getChat(user, hash)
    messages = messages.map(({ text, meta }) => {
        meta = meta || {}
        meta.t = Date.now()
        meta.user = user
        return { text, meta }
    })
    console.log('[CHAT:send]', user, hash, chat.users, messages)
    chat.messages = chat.messages.concat(messages)
    C.chat().updateOne({ hash: chat.hash }, { $set: chat }, { upsert: true });
    ioM.send(chat.users, "chat:update", chat.hash, messages)
    return { chat }
}


module.exports = {
    names,
    getUser,

    newChat,
    getChat,
    readChat,
    sendChat,

    getUserChat,
    readUserChat,
    sendUserChat,

    _putUser,
}
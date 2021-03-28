const db = require('../db');
const { pick, entryMap } = require('../util');
const { randAlphanum } = require('../rand');
const notify = require('../notify').model
const ioM = require('../io')
const chat = require('../chat').model

const names = {
    user: 'wordbase-user',
        // user: string
        // games: number[]
    info: 'wordbase-info',
        // id: string
        // p1: string
        // p2: string
        // status: {0 1 2}
        // progress: [number, number]
        // turn: number
        // lastWord: string
        // lastUpdate: number
        // rematch: string
        // chat: string
    save: 'wordbase-save',
        // id: string
        // state: string
    invite: 'wordbase-invite',
        // id: string,
        // user: string,
}
const C = entryMap(names, name => () => db.collection(name));

async function _getGames(user) {
    if (!user) throw 'user not signed in';
    let entry = await C.user().findOne({ user });
    if (!entry) {
        entry = { user, games: [] };
        C.user().insertOne(entry);
    }
    return entry.games;
}
async function _getInfo(user, id) {
    let entry = await C.info().findOne({ id });
    if (!entry) throw `game ${id} does not exist`;
    if (entry.p1 && ![entry.p1, entry.p2].includes(user)) {
        throw `${user} isn't in game ${id}`;
    }
    return entry;
}
async function _setInfo(info) {
    C.info().updateOne(
        { id: info.id },
        { $set: info },
    );
}

async function getUserInfo(user) {
    let games = await _getGames(user);
    let infoList = await C.info().find({ id: { $in: games } }).toArray();
    return { infoList };
}
async function getInfo(user, id) {
    let info = await _getInfo(user, id);
    return { info };
}
async function getState(user, id) {
    let info = await _getInfo(user, id);
    let save = await C.save().findOne({ id });
    return { info, state: save.state };
}

async function _updateGames(user, games) {
    games = games.filter(g => typeof g === 'string');
    C.user().updateOne(
        { user },
        { $set: { games } },
    );
}
async function _addGame(user, id) {
    let games = await _getGames(user);
    if (!games.includes(id)) {
        _updateGames(user, [id].concat(games));
    }
}
async function _removeGame(user, id) {
    let games = await _getGames(user);
    if (games.includes(id)) {
        _updateGames(user, games.filter(other => other !== id));
        C.invite().deleteOne({ id });
    }
}

async function play(user, id, newInfo, state) {
    let info = await _getInfo(user, id);
    if (!info.p1) {
        info.p1 = user;
        _addGame(user, id);
        _addGame(info.p2, id);
        C.invite().deleteOne({ id });
    }

    Object.assign(info, pick(newInfo, 'turn status progress lastWord'));
    // console.log(info);
    info.lastUpdate = Date.now();
    _setInfo(info);
    C.save().updateOne(
        { id },
        { $set: { state } },
    );

    let other = info.p1 === user ? info.p2 : info.p1;
    ioM.send([user], 'wordbase:update', info)
    notify.send(other, 'wordbase',
        info.status === -1
        ? `${user} played ${info.lastWord.toUpperCase()}`
        : `${user} won with ${info.lastWord.toUpperCase()}`,
        `freshman.dev/wordbase#${info.id}`)
    console.log('[WORDBASE:play]', user, id, info.chat)
    info.chat && chat.sendChat(user, info.chat, [{
        text: info.lastWord,
        meta: {
            classes: `last ${info.turn%2 ? 'p1' : 'p2'}`,
        }
    }])

    return { info }
}

async function resign(user, id) {
    let info = await _getInfo(user, id);
    if (info.status === -1) {
        info.status = (info.p1 === user) ? 1 : 0;
        info.lastUpdate = Date.now();
        info.lastWord = '.resign'
        _setInfo(info);

        let other = info.p1 === user ? info.p2 : info.p1;
        ioM.send(user, 'wordbase:update', info)
        notify.send(other, 'wordbase',
            `${user} resigned, you win!`, `freshman.dev/wordbase#${info.id}`)
    }
    return { info }
}
async function remove(user, id) {
    _removeGame(user, id);
    return resign(user, id);
}
async function rematch(user, id, state) {
    let info = await _getInfo(user, id);
    if (info.status === -1) throw 'game still in progress';

    let rematch
    if (info.rematch) {
        console.log(info.rematch)
        rematch = { info: await _getInfo(user, info.rematch) }
    } else {
        let players = [info.p1, info.p2];
        if (info.status === 0) players.reverse(); // if p1 won, swap
        rematch = await create(...players, state);
        info.rematch = rematch.info.id;
        _setInfo(info)

        let other = info.p1 === user ? info.p2 : info.p1;
        notify.send(other, 'wordbase',
            `${user} requested a rematch!`, `freshman.dev/wordbase#${info.rematch}`)
    }
    return rematch
}
async function challenge(user, other, state) {
    let { info } = await create(user, other, state);
    notify.send(other, 'wordbase',
        `${user} challenged you!`, `freshman.dev/wordbase#${info.id}`)
    chat.sendUserChat(user, other, [{
        meta: {
            read: true,
            page: `/wordbase#${info.id}`,
            pageDesc: `new /wordbase challenge!`,
            pageImg: `/raw/wordbase/favicon.png`,
        }
    }])
    return { info }
}
async function accept(user, id) {
    if (!id) {
        // let me create multiple open invites, but match others with themselves
        let entry = await C.invite().findOne(user === 'cyrus' ? { user: { $ne: user }} : {});
        if (!entry) throw 'no open invites';
        id = entry.id;
    }
    console.log('accept', user, id);
    let info = await _getInfo(user, id);
    console.log(info);
    if (info.p1) {
        C.invite().deleteOne({ id });
        throw 'game already accepted';
    }
    info.p1 = user;
    console.log(info);
    info.lastUpdate = Date.now();
    _setInfo(info);
    _addGame(user, id);
    _addGame(info.p2, id);
    return { info };
}

async function getInvites() {
    let idList = await C.invite().find({}).toArray();
    return { idList }
}
async function create(user, other, state) {
    if (!user) throw 'sign in to create game';
    let id = randAlphanum(7)
    let info = {
        id: id,
        p1: other ? user : undefined,
        p2: other ? other : user,
        turn: 0,
        status: -1,
        progress: [0, 100],
        lastWord: undefined,
        lastUpdate: Date.now(),
        chat: `wordbase+${id}`
    }
    console.log(info);
    _addGame(user, id);
    other && _addGame(other, id);
    C.info().insertOne(info);
    C.save().insertOne({ id, state });
    ioM.send([user, other], 'wordbase:update', info)
    console.log('[WORDBASE:create]', info)
    await chat.newChat([user, other], info.chat)
    return { info }
}
async function open(user, state) {
    let { info } = await create(user, undefined, state);
    C.invite().insertOne({
        id: info.id,
        user,
    });
    return { info }
}

module.exports = {
    names,

    getUserInfo,
    getInfo,
    getState,
    play,

    resign,
    remove,
    rematch,
    challenge,
    accept,

    getInvites,
    create,
    open,
}
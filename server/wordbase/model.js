const db = require('../db');
const { randAlphanum } = require('../rand');

const names = {
    user: 'wordbase-user',
    /*
        user: string
        games: number[]
    */
    info: 'wordbase-info',
    /*
        id: string
        p1: string
        p2: string
        status: {0 1 2}
        progress: [number, number]
        turn: number
        lastWord: string
    */
    save: 'wordbase-save',
    /*
        id: string
        state: string
    */
}

async function getUser(user) {
    let entry = await db.collection(names.user).findOne({ user });
    if (!entry) {
        let entry = { user, games: [] };
        db.collection(names.user).insertOne(entry);
    }
    return entry;
}
async function getInfo(id) {
    return db.collection(names.info).findOne({ id });
}

async function getUserInfo(user) {
    if (!user) return { error: 'sign in to view games' };
    let { games } = await getUser(user);
    let infoList = await db.collection(names.info).find({ id: { $in: games } }).toArray();
    // console.log(user, games, infoList);
    return { infoList };
}
async function getSave(user, id) {
    let info = await getInfo(id);
    let { games } = await getUser(user);
    // console.log(id, info, games);
    if (info.p1 && !games.includes(id)) return { error: `${user} isn't in game ${id}` }

    let save = await db.collection(names.save).findOne({ id });
    return { info, state: save.state };
}

async function addUserGame(user, id) {
    let { games } = await getUser(user);
    if (!games.includes(id)) {
        db.collection(names.user).updateOne(
            { user },
            { $set: {
                user,
                games: [id].concat(games),
            } },
        );
    }
}
async function removeUserGame(user, id) {
    let { games } = await getUser(user);
    if (games.includes(id)) {
        db.collection(names.user).updateOne(
            { user },
            { $set: {
                user,
                games: games.filter(other => other !== id),
            } },
        );
    }
}

async function newGame(user, state) {
    if (!user) return { error: 'sign in to create game invite' };
    let info = {
        id: randAlphanum(7),
        p1: undefined,
        p2: user,
        status: -1,
        progress: [0, 100],
        turn: 0,
        lastWord: undefined,
    }
    addUserGame(user, info.id);
    db.collection(names.info).insertOne(info);
    db.collection(names.save).insertOne({
        id: info.id,
        state,
    });
    return { info }
}
async function play(user, id, newInfo, state) {
    let info = await getInfo(id);
    let { games } = await getUser(user);
    if (info.p1 && !games.includes(id)) return { error: `${user} isn't in game ${id}` };

    if (!info.p1) {
        addUserGame(user, id);
        newInfo.p1 = user;
    }

    db.collection(names.info).updateOne(
        { id },
        { $set: newInfo },
    );
    db.collection(names.save).updateOne(
        { id },
        { $set: {
            id,
            state
        } },
    );
    return { info: newInfo }
}

async function resign(user, id) {
    let info = await getInfo(id);
    let { games } = await getUser(user);
    if (!games.includes(id)) return { error: `${user} isn't in game ${id}` };

    info.status = (info.p1 === user) ? 1 : 0;
    db.collection(names.info).updateOne(
        { id },
        { $set: info },
    );
    return { info }
}
async function remove(user, id) {
    let { games } = await getUser(user);
    if (!games.includes(id)) return { error: `${user} isn't in game ${id}` };

    await resign(user, id);
    removeUserGame(user, id);
    return { ok: true };
}

module.exports = {
    names,
    getUserInfo,
    getSave,
    newGame,
    play,
    resign,
    remove
}
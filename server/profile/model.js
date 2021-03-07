const db = require('../db');
const { entryMap, remove } = require('../util');
const login = require('../login').model;
const notify = require('../notify').model;

const names = {
    profile: 'profile',
        // user: string
        // bio: string
        // friends: string[]
        // follows: string[]
        // followers: string[]
        // unfollowers: string[]
}
const C = entryMap(names, name => () => db.collection(name));

async function _getUser(user) {
    if (!user) throw Error('user not signed in');
    return (await get(user)).profile;
}
async function get(user) {
    let profile = await C.profile().findOne({ user });
    if (!profile) {
        if (await login.get(user)) {
            profile = { user, bio: '', friends: [], follows: [], followers: [] };
            C.profile().insertOne(profile);
        } else {
            let similar = (await C.profile().find({
                user: {
                    $regex: `${user}`,
                    $options: 'i',
                }
            }).toArray()).map(entry => entry.user).sort()
            return { similar }
        }
    }
    return { profile }
}
async function update(user, props) {
    let { profile } = await get(user);
    Object.assign(profile, props);
    C.profile().updateOne({ user }, { $set: profile });
    return { profile };
}

async function follow(user, other) {
    let viewer = await _getUser(user);
    let { profile } = await get(other);
    if (!viewer.follows.includes(other)) {
        let userUpdate = { follows: [other].concat(viewer.follows) }
        let otherUpdate = { followers: [user].concat(profile.followers) }
        let isFriend = profile.follows.includes(user);
        if (isFriend) {
            userUpdate.friends = [other].concat(viewer.friends);
            otherUpdate.friends = [user].concat(profile.friends);
        }
        viewer = (await update(user, userUpdate)).profile
        profile = (await update(other, otherUpdate)).profile
        if (!(profile.unfollowers || []).includes(user)) {
            notify.send(other, 'profile', `@${user} followed you`, `freshman.dev/u/${user}`)
        }
    }
    return {
        viewer,
        profile
    }
}
async function unfollow(user, other) {
    let viewer = await _getUser(user);
    let { profile } = await get(other);
    if (viewer.follows.includes(other)) {
        let userUpdate = { follows: remove(viewer.follows, other) }
        let otherUpdate = {
            followers: remove(profile.followers, user),
            unfollowers: [user].concat(
                remove(profile.unfollowers || [], user))
        }
        let isFriend = profile.follows.includes(user);
        if (isFriend) {
            userUpdate.friends = remove(viewer.friends, other);
            otherUpdate.friends = remove(profile.friends, user);
        }
        viewer = (await update(user, userUpdate)).profile
        profile = (await update(other, otherUpdate)).profile
    }
    return {
        viewer,
        profile
    }
}

async function checkin(user, path) {
    let viewer = await _getUser(user);
    let recents = [path].concat(remove(viewer.recents || [], path)).slice(0, 3);
    let profile = await update(user, { recents });
    return { profile }
}

module.exports = {
    names,
    get,
    follow,
    unfollow,
    checkin,
}
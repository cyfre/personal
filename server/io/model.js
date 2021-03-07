const db = require('../db');
const { entryMap, remove } = require('../util');
const login = require('../login').model;
const mail = require('../mail');
const { randAlphanum } = require('../rand');

const names = {
    io: 'io',
        // user: string
        // ids: string[]
}
const C = entryMap(names, name => () => db.collection(name));

async function get(user) {
    let io = await C.io().findOne({ user })
    return { io }
}
async function put(io) {
    await C.io().updateOne({ user: io.user }, { $set: io }, { upsert: true });
    return { io };
}

async function addIo(user, socketId) {
   let io = (await get(user)).io || {
      user,
      ids: []
   }
   io.ids.push(socketId)
   console.log('[IO:add]', io)
   return await put(io)
}
async function removeIo(user, socketId) {
   let { io } = await get(user)
   if (io) {
      io.ids = io.ids.filter(s => s !== socketId)
      if (io.ids.length === 0) {
         C.io().deleteOne({ user })
      } else {
         put(io)
      }
   }
   console.log('[IO:remove]', io)
   return { io }
}
async function clearIo() {
   console.log('[IO:clear]')
   C.io().deleteMany({})
}

module.exports = {
    names,
    get,
    addIo,
    removeIo,
    clearIo,
}
const M = require('./model')


let _io
function set(io) {
   _io = io
}
function inst() {
   return _io
}

async function send(users, event, ...eventArgs) {
   let isSingle = typeof users === 'string'
   let results = await Promise.all((isSingle ? [users] : users).map(async user => {
      let { io } = user ? await M.get(user) : {}

      if (!io || !io.ids.length) return false

      console.log('[IO:send]', event, io)
      io.ids.forEach(socketId => {
         inst().to(socketId).emit(event, ...eventArgs)
      })
      return true
   }))
   return (isSingle) ? results[0] : results
}

const roomUsers = {}
function roomed(io, socket, info, name, onJoin=undefined, onLeave=undefined) {
   if (!roomUsers[name]) roomUsers[name] = []
   let users = roomUsers[name]
   let joined = false

   function join() {
      if (!joined) {
         console.log(`[IO:${name}:join]`, info)
         joined = info.user || 'user'

         users.push(joined)
         // users.sort()

         socket.join(name)
         io.to(name).emit(`${name}:online`, users)
         onJoin && onJoin(joined, users)
      }
   }
   function leave() {
      if (joined) {
         users.splice(users.indexOf(joined), 1)

         onLeave && onLeave(joined, users)
         io.to(name).emit(`${name}:online`, users)
         socket.leave(name)

         joined = false
         console.log(`[IO:${name}:leave]`, info)
      }
   }

   socket.on(`${name}:join`, join);
   socket.on(`${name}:leave`, leave);
   socket.on('disconnect', leave);
}

module.exports = {
   set,
   inst,
   send,
   roomed,
   model: M,
}
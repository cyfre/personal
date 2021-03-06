
let users = []
module.exports = (io, socket, info) => {
  let joined = false
  function join() {
    if (!joined) {
      console.log('[IO:SPECKLE:JOIN]', info)
      joined = info.user || 'user'
      users.push(joined)
      users.sort()
      socket.join('speckle')
      io.to('speckle').emit('speckle:online', users)
    }
  }
  function leave() {
    if (joined) {
      console.log('[IO:SPECKLE:LEAVE]')
      users.splice(users.indexOf(joined), 1)
      io.to('speckle').emit('speckle:online', users)
      socket.leave('speckle')
      joined = false
    }
  }

  socket.on('speckle:dot', data => {
    // console.log('[IO:SPECKLE:DOT]')
    socket.to('speckle').emit('speckle:dot', data);
  });
  socket.on('speckle:join', join);
  socket.on('speckle:leave', leave);
  socket.on('disconnect', leave);
}
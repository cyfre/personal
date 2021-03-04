

let n = 0
module.exports = (io, socket, info) => {
  let joined = false
  function join() {
    if (!joined) {
      console.log('[IO:LIVE:JOIN]', info)
      n += 1
      joined = info.user || 'user'
      io.emit('live:online', n)
      io.emit('live:message', `> ${joined} joined`)
    }
  }
  function leave() {
    if (joined) {
      console.log('[IO:LIVE:LEAVE]')
      n -= 1
      io.emit('live:online', n)
      io.emit('live:message', `> ${joined} left`)
      joined = false
    }
  }

  socket.on('live:message', data => {
      io.emit('live:message', `${info.user || 'user'}: ${data}`);
  });
  socket.on('live:join', join);
  socket.on('live:leave', leave);
  socket.on('disconnect', leave);
}
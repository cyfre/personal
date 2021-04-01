const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const port = 5000;
const server = require('http').createServer(app)
const io = require('socket.io')(server, {})

const login = require('./login');

// parse JSON requests
app.use(bodyParser.json({
    extended: true,
    limit: '50mb'
}));
// user auth
app.use((req, res, next) => {
    login.auth(req).then(user => {
        req.user = user;
        next();
    });
});
// log errors
app.use((err, req, res, next) => {
    console.log(err);
    next();
});
// log timestamped url requests
app.use((req, res, next) => {
    console.log(String(Date.now()), req.method, req.originalUrl, req.user);
    next();
});
// socket io
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/login', login.routes);
app.use('/api/((u)|profile)', require('./profile').routes);
app.use('/api/notify', require('./notify').routes);
app.use('/api/reset', require('./reset').routes);
app.use('/api/wordbase', require('./wordbase').routes);
app.use('/api/graffiti', require('./graffiti').routes);
app.use('/api/turt', require('./turt').routes);
app.use('/api/cityhall', require('./cityhall').routes);
app.use('/api/msg', require('./msg').routes);
app.use('/api/ly', require('./ly').routes);
app.use('/api/scores', require('./scores').routes);
app.use('/api/chat', require('./chat').routes);
app.use('/api/tally', require('./tally').routes);
app.use('/api/((i)|counter)', require('./counter').routes);

app.use('/ly', require('./ly/redirect').routes)

require('./io').set(io)
const ioM = require('./io')
ioM.set(io)
const ios = [
    require('./io/live'),
    // require('./notify/io'),
    require('./io/speckle'),
    require('./chat/io'),
]
io.on('connection', socket => {
    let info = {}
    socket.on('login', auth => {
        login.authIo(auth).then(user => {
            info.user = user;
            ioM.model.addIo(user, socket.id)
            console.log('[IO:login]', info)
            socket.emit('login:done')
        });
    })
    socket.on('disconnect', auth => {
        console.log('[IO:logout]', info)
        info.user && ioM.model.removeIo(info.user, socket.id)
    })
    ios.forEach(ioReg => ioReg(io, socket, info))
});


// production build
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('/*', function (req, res, next) {
    if (req.url.match('^/api(|(/.*))$')) return next()
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// start server
db.connect('mongodb://localhost/site', (err) => {
    if (err) {
        console.log(err)
    } else {
        ioM.model.clearIo()
        server.listen(port, () => `App started on port ${port}`)
        // let appServer = app.listen(port, () => console.log(`App started on port ${port}`));
    }
})
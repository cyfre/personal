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
let profileRoutes = require('./profile').routes
app.use('/api/u', profileRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notify', require('./notify').routes);
app.use('/api/reset', require('./reset').routes);
app.use('/api/wordbase', require('./wordbase').routes);
app.use('/api/graffiti', require('./graffiti').routes);
app.use('/api/turt', require('./turt').routes);
app.use('/api/cityhall', require('./cityhall').routes);
app.use('/api/msg', require('./msg').routes);
app.use('/api/ly', require('./ly').routes);
app.use('/api/scores', require('./scores').routes);

app.use('/ly', require('./ly/redirect').routes)

const regLive = require('./io/live')
const regNotify = require('./notify/io')
io.on('connection', socket => {
    let info = {}
    socket.on('login', auth => {
        login.authIo(auth).then(user => {
            info.user = user;
            console.log('[IO:LOGIN]', info)
            socket.emit('login:done')
        });
    })
    regLive(io, socket, info)
    regNotify(io, socket, info)
    socket.on('newListener', (data) => {
        console.log('NL', data, info)
    })
});


// production build
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('/*', function (req, res) {
   res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// start server
db.connect('mongodb://localhost/site', (err) => {
    if (err) {
        console.log(err)
    } else {
        server.listen(port, () => `App started on port ${port}`)
        // let appServer = app.listen(port, () => console.log(`App started on port ${port}`));
    }
})
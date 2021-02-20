const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db');

const login = require('./login');

const app = express();
const port = 5000;

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

app.use('/api/login', login.routes);
app.use('/api/profile', require('./profile').routes);
app.use('/api/wordbase', require('./wordbase').routes);
app.use('/api/graffiti', require('./graffiti').routes);
app.use('/api/turt', require('./turt').routes);
app.use('/api/cityhall', require('./cityhall').routes);
app.use('/api/msg', require('./msg').routes);
app.use('/api/ly', require('./ly').routes);

// production build
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('/*', function (req, res) {
   res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// start server
db.connect('mongodb://localhost/site', (err) =>
    err
        ? console.log(err)
        : app.listen(port, () => console.log(`App started on port ${port}`)));

const express = require('express');
const M = require('./model');
const { J, U } = require('../util.js');

const R = express.Router();
R.get('/', J(rq => M.get( U(rq) )));
// R.post('/web', J(rq => M.web( U(rq), rq.body.something)));
// R.post('/twitter', J(rq => M.twitter( U(rq), rq.body.handle)));
R.post('/email', J(rq => M.email( U(rq), rq.body.email)));
R.post('/verify', J(rq => M.verify(rq.body.token)));

R.get('/sub/:app', J(rq => M.sub( U(rq), rq.params.app )));
R.put('/sub/:app', J(rq => M.sub( U(rq), rq.params.app, true )));
R.delete('/sub/:app', J(rq => M.sub( U(rq), rq.params.app, false )));

R.get('/msg', J(rq => M.read( U(rq) )));
R.get('/msg/:app', J(rq => M.read( U(rq), rq.params.app)));
R.post('/msg/:app', J(rq => U(rq) && M.send(rq.body.user, rq.params.app, rq.body.text)));

module.exports = {
    routes: R,
    model: M,
}
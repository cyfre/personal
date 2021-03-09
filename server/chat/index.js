const express = require('express');
const M = require('./model');
const { J, U } = require('../util.js');

const R = express.Router();
// R.get('/', J(rq => M.getAll( U(rq) )));
R.get('/', J(rq => M.getUser( U(rq) )));
R.get('/u/:user', J(rq => M.readUserChat( U(rq), rq.params.user )));
R.post('/u/:user', J(rq => M.sendUserChat( U(rq), rq.params.user, rq.body.messages )));

R.get('/:hash', J(rq => M.readChat( U(rq), rq.params.hash )));
R.post('/', J(rq => M.newChat( [...new Set(rq.body.users.concat(U(rq)))], rq.body.hash )));
R.post('/:hash', J(rq => M.sendChat( U(rq), rq.params.hash, rq.body.messages )));

module.exports = {
    routes: R,
    model: M,
}
const express = require('express');
const M = require('./model');
const { J, U } = require('../util.js');

const R = express.Router();
R.get('/', J(rq => M.get( U(rq) )));
R.post('/bio', J(rq => M.get( U(rq), { bio: rq.body.bio })));
R.post('/checkin/:path', J(rq => M.checkin( U(rq), '/' + rq.params.path)));
R.get('/:id', J(rq => M.get(U(rq), rq.params.id)));
R.post('/:id/follow', J(rq => M.follow( U(rq), rq.params.id)));
R.post('/:id/unfollow', J(rq => M.unfollow( U(rq), rq.params.id)));

function requireProfile(rq) {
    return M.get( U(rq))
}

module.exports = {
    routes: R,
    model: M,
    requireProfile, P: requireProfile,
}
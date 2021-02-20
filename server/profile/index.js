const express = require('express');
const M = require('./model');
const { J } = require('../util.js');

const R = express.Router();
R.get('/', J(rq => M.get(rq.user)));
R.post('/bio', J(rq => M.get(rq.user, { bio: rq.body.bio })));
R.get('/:id', J(rq => M.get(rq.params.id)));
R.post('/:id/follow', J(rq => M.follow(rq.user, rq.params.id)));
R.post('/:id/unfollow', J(rq => M.unfollow(rq.user, rq.params.id)));

module.exports = {
    routes: R,
    model: M,
}
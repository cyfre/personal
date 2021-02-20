const express = require('express');
const M = require('./model');
const { J } = require('../util.js');

const R = express.Router();
const P = {
    invites: '/i(nvites)?',
    games: '/g(ames)?',
    gameId: `/g(ames)?/:id`
}

// get & play info/save
R.get(P.games, J(rq => M.getUserInfo(rq.user)));
R.get(P.gameId, J(rq => M.getState(rq.user, rq.params.id)));
R.post(P.gameId, J(rq => M.play(rq.user, rq.params.id, rq.body.info, rq.body.state)));

// game options
R.post(`${P.gameId}/resign`, J(rq => M.resign(rq.user, rq.params.id)));
R.post(`${P.gameId}/delete`, J(rq => M.remove(rq.user, rq.params.id)));
R.post(`${P.gameId}/rematch`, J(rq => M.rematch(rq.user, rq.params.id, rq.body.state)));
R.post(`${P.gameId}/accept`, J(rq => M.accept(rq.user, rq.params.id)));

// invites
R.get(P.invites, J(rq => M.getInvites()));
R.post(`${P.invites}/accept`, J(rq => M.accept(rq.user)));
R.post(`${P.invites}/open`, J(rq => M.open(rq.user, rq.body.state)));
R.post(`${P.invites}/private`, J(rq => M.create(rq.user, undefined, rq.body.state)));
R.post(`${P.invites}/friend/:user`, J(rq => M.create(rq.user, rq.params.user, rq.body.state)));

module.exports = {
    routes: R,
    model: M,
}
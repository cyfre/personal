const express = require('express');
const M = require('./model');
const { J, U } = require('../util.js');

const R = express.Router();

R.get('/first/user', J(rq => M.getUserFirst( U(rq) )));
R.get('/first/global', J(rq => M.getGlobalFirst(  )));
R.get('/first/user/:app', J(rq => M.getUserAppFirst( U(rq), rq.params.app )));
R.get('/first/global/:app', J(rq => M.getGlobalAppFirst( rq.params.app )));

R.get('/user', J(rq => M.getUser( U(rq) )));
R.get('/global', J(rq => M.getGlobal(  )));
R.get('/user/:app', J(rq => M.getUserApp( U(rq), rq.params.app )));
R.get('/global/:app', J(rq => M.getGlobalApp( rq.params.app )));

R.get('/:app', J(rq => M.getScore( rq.params.app, rq.user )));
R.get('/', J(rq => M.getScores( rq.user )));
R.post('/:app', J(rq => M.addScore( U(rq), rq.params.app, rq.body.score )));


// R.get('/', J(rq => M.getUserAll( U(rq) )));

// R.get('/top', J(rq => M.getAppAll()));
// R.get('/top/:app', J(rq => M.getApp( rq.params.app )));

// R.get('/first', J(rq => M.getAppAllFirst()));
// R.get('/first/user', J(rq => M.getUserAllFirst( U(rq) )));
// R.get('/first/:app', J(rq => M.getUserAppFirst( U(rq), rq.params.app )));

// R.get('/:app', J(rq => M.getUserApp( U(rq), rq.params.app )));
// R.post('/:app', J(rq => M.addScore( U(rq), rq.params.app, rq.body.score )));


module.exports = {
    routes: R,
    model: M,
}
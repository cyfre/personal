const express = require('express');
const M = require('./model');
const { J, U } = require('../util.js');

const R = express.Router();
R.get('/', J(rq => M.get( U(rq) )));

R.post('/', J(rq => M.update( U(rq), rq.body)));
R.put('/:term', J(rq => M.create( U(rq), rq.params.term)));
R.post('/:term/:time', J(rq => M.tally( U(rq), rq.params.term, rq.params.time)));
R.delete('/:term', J(rq => M.remove( U(rq), rq.params.term)));
R.post('/:term/rename/:to', J(rq => M.rename( U(rq), rq.params.term, rq.params.to)));

module.exports = {
    routes: R,
    model: M,
}
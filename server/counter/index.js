const express = require('express');
const M = require('./model');
const { J, U, P } = require('../util.js');

const R = express.Router();

function tick(rq) {
    let amount = P(rq, 'amount') ?? P(rq, 'shift') ?? P(rq, 'x')
    return M.shift( rq.params.space || 'default', rq.params.key, (amount === undefined) ? 1 : Number(amount) )
}
R.get('/tick/:space?/:key', J(tick));
R.post('/:space?/:key', J(tick));

R.get('/:space?/:key', J(rq => M.get(rq.params.space || 'default', rq.params.key)));

module.exports = {
    routes: R,
    model: M,
}
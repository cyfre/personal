const express = require('express');
const model = require('./model');
const { jsonRes } = require('../util.js');

const routes = express.Router();
routes.get('/games', jsonRes(req => model.getUserInfo(req.user)));
routes.get('/games/:id', jsonRes(req => model.getSave(req.user, req.params.id)));
routes.post('/new', jsonRes(req => model.newGame(req.user, req.body.state)));
routes.post('/games/:id', jsonRes(req =>
    model.play(req.user, req.params.id, req.body.info, req.body.state)));
routes.post('/games/:id/resign', jsonRes(req => model.resign(req.user, req.params.id)));
routes.post('/games/:id/delete', jsonRes(req => model.remove(req.user, req.params.id)));

module.exports = {
    routes,
    model,
}
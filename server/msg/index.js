const express = require('express');
const util = require('../util.js');
const model = require('./model');

const routes = express.Router();
routes.post('/', util.wrapReturn(model.create));

module.exports = {
    routes,
    model
}
const express = require('express');
const model = require('./model');

const routes = express.Router();
routes.get('/', (req, res) => {
    model.get()
        .then(data => res.json(data))
        .catch(err => res.json(err));
});
routes.put('/', (req, res) => {
    model.update(req.body)
        .then(data => res.json(data))
        .catch(err => res.json(err));
});

module.exports = {
    routes,
    model
}
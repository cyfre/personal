const express = require('express');
const model = require('./model');

const routes = express.Router();
routes.get('/:id', (req, res) => {
    model.get(req.params.id)
        .then(data => res.json(data))
        .catch(error => res.json({ error }));
});
routes.post('/', (req, res) => {
    model.create(req.body)
        .then(data => res.json(data))
        .catch(error => res.json({ error }));
});
routes.put('/:id', (req, res) => {
    model.update(req.params.id, req.body)
        .then(data => res.json(data))
        .catch(error => res.json({ error }));
});

module.exports = {
    routes,
    model
}
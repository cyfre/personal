const express = require('express');
const db = require('./db');
const { ObjectID } = require('mongodb');

function update(target, source) {
    for (let prop in source) {
        if (prop in target) {
            target[prop] = source[prop];
        }
    }
}
function squash(objList) {
    return Object.assign({}, ...objList);
}
function pick(obj, spaceDelimitedProps) {
    return squash(spaceDelimitedProps.split(' ').map(prop => ({ [prop]: obj[prop] })));
}
function entryMap(obj, func) {
    return squash(Object.entries(obj).map(e => ({ [e[0]]: func(e[1]) }) ))
}
function remove(arr, item) {
    return arr.filter(x => x !== item);
    // let copy = arr.slice();
    // let index = copy.indexOf(item);
    // if (index > -1) copy.splice(index, 1);
    // return copy;
}

function genGetAll(name) {
    return async () => db.collection(name).find().toArray();
}

function genGet(name) {
    return async (id) => db.collection(name).findOne({ _id: ObjectID(id) });
}

function genRemove(name) {
    return async (id) => db.collection(name).deleteOne({ _id: ObjectID(id) });
}

function jsonRes(func) {
    return (req, res) => func(req)
        .then(data => {
            // console.log(data);
            res.json(data);
        })
        .catch(error => {
            console.log(error);
            res.json({ error })
        });
}

function genModelRoutes(model, routes) {
    if (routes === undefined) routes = express.Router();

    // route configs
    [{
        method: 'get', path: '/',
        modelFunc: req => (model.getAll || genGetAll(model.name))()
    }, {
        method: 'get', path: '/:id',
        modelFunc: req => (model.get || genGet(model.name))(req.params.id)
    }, {
        method: 'post', path: '/',
        modelFunc: req => model.create(req.body)
    }, {
        method: 'put', path: '/:id',
        modelFunc: req => model.update(req.params.id, req.body)
    }, {
        method: 'delete', path: '/:id',
        modelFunc: req => (model.remove || genRemove(model.name))(req.params.id)
    }].forEach(config => {
        routes[config.method](config.path, jsonRes(config.modelFunc));
    });

    return routes;
}

module.exports = {
    update,
    pick,
    entryMap,
    remove,
    genGetAll,
    genGet,
    jsonRes, J: jsonRes,
    genModelRoutes
}
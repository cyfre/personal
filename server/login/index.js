const express = require('express');
const model = require('./model');
const { jsonRes } = require('../util.js');

const routes = express.Router();
routes.post('/', jsonRes(req => {
    let { user, pass } = req.body;
    console.log(user, pass);
    return model.login(user, pass);
}));
routes.post('/signup', jsonRes(req => {
    let { user, pass } = req.body;
    console.log(user, pass);
    return model.signup(user, pass);
}));
routes.post('/verify', jsonRes(req => {
    let { user, token } = req.body;
    return model.check(user, token);
}));
routes.post('/change-pass', jsonRes(req => {
    let { user, currPass, newPass } = req.body;
    return model.changePass(user, currPass, newPass);
}));

async function auth(req) {
    let user = req.header('X-Freshman-Auth-User');
    let token = req.header('X-Freshman-Auth-Token');
    if (user && token) {
        let result = await model.check(user, token);
        console.log(user, result);
        if (result.ok) return user;
    }
    return false;
}

module.exports = {
    routes,
    model,
    auth,
}
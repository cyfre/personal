import { rejects } from 'assert';
import api from './api';
import { fetchCookie, saveCookie } from './util';

async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const authTriggers = [];
export function addAuthTrigger(callback) {
    authTriggers.push(callback);
}
export function removeAuthTrigger(callback) {
    let index = authTriggers.indexOf(callback);
    if (index > -1) authTriggers.splice(index, 1);
}

const AUTH_COOKIE = 'loginAuth'
function setAuth(user, token) {
    Object.assign(auth, { user, token });
    saveCookie(AUTH_COOKIE, auth);
    authTriggers.forEach(callback => callback(auth));
}
export const auth = fetchCookie(AUTH_COOKIE) || {};
window.auth = auth;

export function logout() {
    setAuth(undefined, undefined);
}
window.logout = logout;

function signin(path, user, pass) {
    return new Promise((resolve, reject) => {
        sha256(pass)
            .then(hash => api.post(path, {
                user,
                pass: hash,
            }))
            .then(data => {
                console.log(data);
                if (data.token) {
                    setAuth(user, data.token);
                    resolve(auth);
                }
            })
            .catch(err => {
                console.log('err', err);
                reject(err);
            });
    });
}

export function login(user, pass) {
    return signin('/login', user, pass);
}
window.login = login;

export function signup(user, pass) {
    return signin('/login/signup', user, pass);
}
window.signup = signup;

export function verify(user, token) {
    api.post('/login/verify', {
        user,
        token,
    }, res => {
        console.log(res);
        if (!res.ok) {
            logout();
        }
    });
}
window.verify = verify;
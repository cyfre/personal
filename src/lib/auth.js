import api from './api';
import { getStored, setStored } from './util';

async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const authTriggers = [
    auth => auth.user && verify(auth.user, auth.token).then(res => {
        if (!res.ok) {
            logout();
        }
    })
];
export function addAuthTrigger(callback) {
    authTriggers.push(callback);
}
export function removeAuthTrigger(callback) {
    let index = authTriggers.indexOf(callback);
    if (index > -1) authTriggers.splice(index, 1);
}

const AUTH_COOKIE = 'loginAuth'
function setAuth(user, token, dropdown) {
    Object.assign(auth, { user, token, dropdown });
    setStored(AUTH_COOKIE, auth);
    authTriggers.forEach(callback => callback(auth));
}
export const auth = getStored(AUTH_COOKIE) || { user: undefined, token: undefined, dropdown: false };
setTimeout(() => setAuth(auth.user, auth.token), 500); // verify auth after api has loaded
window.auth = auth;

export function logout() {
    setAuth('', '');
}
window.logout = logout;

export function openLogin() {
    setAuth(auth.user, auth.token, true);
}

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
    return api.post('/login/verify', {
        user,
        token,
    });
}
window.verify = verify;
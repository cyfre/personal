import { auth } from './auth.js';

const api = {};
[
    { service: 'get', verb: 'GET', options: false },
    { service: 'post', verb: 'POST', options: true },
    { service: 'put', verb: 'PUT', options: true },
    { service: 'delete', verb: 'DELETE', options: false },

    // CRUD naming
    { service: 'create', verb: 'POST', options: true },
    { service: 'read', verb: 'GET', options: false },
    { service: 'update', verb: 'PUT', options: true },
].forEach(({ service, verb, options }) => {
    api[service] = (path, params, callback) => {
        let req = {
            method: verb,
            headers: {
                'X-Freshman-Auth-User': auth.user,
                'X-Freshman-Auth-Token': auth.token,
            }
        }
        if (options) {
            req.headers['Content-Type'] = 'application/json';
            req.body = JSON.stringify(params || {});
        } else callback = params

        // console.log('/api' + path.replace(/^\/api/, '').replace(/^\/*/, '/'));
        return new Promise((resolve, reject) => {
            fetch('/api' + path.replace(/^\/api/, '').replace(/^\/*/, '/'), req)
                .then(res => res.json().then(data => {
                    if (res.ok) {
                        if (data.error) {
                            console.log('api error', data.error);
                            reject(data);
                        } else {
                            callback && callback(data);
                            resolve(data);
                        }
                    } else {
                        let msg = `server error, failed ${service} ${path}: ` + data.message;
                        console.log(msg); reject(msg);
                    };
                }))
                .catch(err => {
                    let msg = 'connection error: ' + err.message;
                    console.log(msg); reject(msg);
                });
        });
    }
})

export default api
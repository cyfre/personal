import { resolveModuleName } from 'typescript';
import { auth } from './auth';

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
        if (!options) callback = params;

        return new Promise(resolve => {
            fetch('/api' + path.replace(/^\/api/, ''), {
                method: verb,
                ...( options ? {
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                    auth
                } : {}),
            })
                .then(res => res
                    .json()
                    .then(data => {
                        if (res.ok) {
                            callback && callback(data);
                            resolve(data);
                        } else alert(`Failed to ${service} ${path}: ` + data.message);
                    }))
                .catch(err => alert("Error in sending data to server: " + err.message));
        });
    }
})

export default api;
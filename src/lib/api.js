const api = {};
[
    { service: 'read', verb: 'GET', options: false },
    { service: 'create', verb: 'POST', options: true },
    { service: 'update', verb: 'PUT', options: true },
    { service: 'delete', verb: 'DELETE', options: false }
].forEach(({ service, verb, options }) => {
    api[service] = (path, params, callback) => {
        if (!options) callback = params;

        fetch('/api' + path.replace(/^\/api/, ''), {
            method: verb,
            ...( options ? {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            } : {}),
        })
            .then(res => res
                .json()
                .then(data =>
                    res.ok
                        ? callback && callback(data)
                        : alert(`Failed to ${service} ${path}: ` + data.message)))
            .catch(err => alert("Error in sending data to server: " + err.message));
    }
})

export default api;
const alphanum = 'qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPASDFGHJKLZXCVBNM';
const randi = n => {
    return Math.floor(Math.random() * n);
}
const randAlphanum = n => {
    let str = '';
    for (let i = 0; i < n; i++) {
        str += alphanum[randi(alphanum.length)];
    }
    return str;
}

module.exports = {
    randi,
    randAlphanum,
}
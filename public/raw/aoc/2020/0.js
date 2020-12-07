function answer(input, callback) {
    let answers = {};
    callback(input.split('\n'), ...['p1', 'p2'].map(pN => aN => { answers[pN] = aN; }));
    return answers;
}

window.solution = input => answer(input, (lines, p1, p2) => {

});
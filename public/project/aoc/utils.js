(() => {
    window.U = {
        numSort: arr => arr.sort((a, b) => a - b),
        sum: (arr, func) => arr.reduce((sum, val) => sum + func(val), 0),
        product: (arr, func) => arr.reduce((prod, val) => prod * func(val), 1),
    };
})();
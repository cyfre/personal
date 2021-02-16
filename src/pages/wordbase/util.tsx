/**
 * initArr: Initialize array of length n with index-based function for each i
 */
export const initArr = (n: number, func: (i:number)=>any) => Array.from({length: n}, (_, i) => func(i));

/**
 * randi: Random integer between [0, n)
 */
export const randi = (n: number) => Math.floor(Math.random() * n);

/**
 * end: index from end of array
 */
export const end = (arr: any[], i?: number) => {
    i = i || 1;
    return arr.length >= i && arr.slice(-i)[0];
};

/**
 * dist: euclidean distance
 */
export const dist = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

/**
 * manhat: manhattan distance
 */
export const manhat = (x1: number, y1: number, x2: number, y2: number) =>
    Math.abs(x1 - x2) + Math.abs(y1 - y2);
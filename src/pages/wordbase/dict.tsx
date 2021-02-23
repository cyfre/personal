import { initArr, randi } from './util';

let dict: Set<string>;
fetch('/lib/words_alpha.txt').then(resp => resp.text()).then(text => {
    let dictList: string[] = text.split('\n').map(s => s.trim());
    dict = new Set(dictList);
    console.log(`loaded ${dict.size} words`);
});

/**
 * isValidWord: check if a word is in the dictionary
 */
export const isValidWord = (word: string): boolean => dict.has(word);


// alpha: list of letters with relative letter frequency
const original = { e: 12, t: 9, a: 8, o: 7, i: 7, n: 6, s: 6, r: 6, h: 5, d: 4, l: 3, u: 2, c: 2, m: 2, f: 2, y: 2, w: 2, g: 2, p: 1, b: 1, v: 0, k: 0, x: 0, q: 0, j: 0, z: 0 };
const lessE = { e: 8, t: 7, a: 7, o: 7, i: 7, n: 6, s: 6, r: 6, h: 5, d: 4, l: 3, u: 2, c: 2, m: 2, f: 2, y: 2, w: 2, g: 2, p: 1, b: 1, v: 0, k: 0, x: 0, q: 0, j: 0, z: 0 };
const alphaCounts = { e: 8, t: 7, a: 7, o: 7, i: 6, n: 6, s: 6, r: 6, h: 5, d: 4, l: 3, u: 3, c: 2, m: 2, f: 2, y: 2, w: 2, g: 2, p: 1, b: 1, v: 0, k: 0, x: -.5, q: -.5, j: -.5, z: -.5 };
const alpha = Object.entries(lessE).map(pair =>
    initArr(Math.floor(2*(Math.pow(pair[1], 1) + 1)), () => pair[0]).join('')).join('');

/**
 * randAlpha: random letter with relative frequency
 */
export const randAlpha = () => alpha[randi(alpha.length)];

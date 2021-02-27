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

// const count = {
//     a: 9 + 13,
//     b: 5 + 2,
//     c: 6 + 3,
//     d: 2 + 7,
//     e: 15 + 11,
//     f: 1 + 2,
//     g: 2 + 3,
//     h: 5 + 2,
//     i: 10 + 7,
//     j: 0 + 0,
//     k: 1 + 3,
//     l: 7 + 6,
//     m: 3 + ,
//     n: 10 + ,
//     o: 7 + ,
//     p: 4 + ,
//     q: 0 + ,
//     r: 7 + ,
//     s: 12 + ,
//     t: 10 + ,
//     u: 4 + ,
//     v: 2 + ,
//     w: 0 + ,
//     x: 2 + ,
//     y: 3 + ,
//     z: 0 + ,
// };

// const alpha = Object.entries(lessE).map(pair =>
//     initArr(Math.floor(2*(Math.pow(pair[1], 1) + 1)), () => pair[0]).join('')).join('');

const b1 = 'potncldocbrsexeieninyetltnrsossynilsiphaadfleamsitpeuxatenrsslchertesurygnsodtneahtilvicibtamuvcauhkehsleoltceroabgnsiasbemnipoerb'
const b2 = 'futafalsridoslrlgantnkwnniesnseysgatmeoeiwadrunapstysivrvrkissdrieotaenltetdsaodgpaseaudtpsmslotnbeytioresrakucldcuatrnshhakbtestdc'
const b3 = 'rnedcinragsedrteudesiuriosclhinfealrupbolglmwloeruowierpniscineihlgoaewsaresrnshuotlntoifcdscosmsfesnehkeatoweeanhwrzrlnpstceaniof'
const b4 = 'dcrasieineeiutnmanuovrsdoesdgbeiexslevorptckitagibliatroftliaxisfcaiyavreniolrbriatdradpdeempylehuirivedtisevebdtusqfnaiskyouawylp'
const b5 = 'wnduchgnefirgsisntovtitntvinuiohaciactcrdpeoytionewspmerngrdamoanuiztoslisedmaoelderdflgewetdneiuimeraeiodytsintipmhlalheotanisiwo'
const alpha = b1 + b2 + b3 + b4 + b5;

/**
 * randAlpha: random letter with relative frequency
 */
export const randAlpha = () => alpha[randi(alpha.length)];

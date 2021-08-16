import * as nl from './nl.js';

let lang = 'nl';
document.querySelector('body').classList.add('lang-' + lang);

// Use a switch with predefined dynamic imports so rollup knows whats going on
// let language;
// switch (lang) {
//     case 'nl':
//     default:
//     language = import('./nl.js').default;
// }
// TODO: figure out how to make dynamic imports work in Rollup

const language = nl.default;
export default language;

import {terser} from "rollup-plugin-terser";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
    input: './js/app.js',
    output: [
        {
            file: './dist/app.js'
        },
        {
            file: './dist/app.min.js',
            plugins: [terser()]
        }
    ],
    inlineDynamicImports: true
};

export default config;

import {terser} from "rollup-plugin-terser";
import serve from "rollup-plugin-serve";
import nodeResolve from "@rollup/plugin-node-resolve";

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
    inlineDynamicImports: true,
    plugins: [
        serve({
            open: true,
            port: 10001,
        }),
        nodeResolve({
            browser: true
        })
    ]
};

export default config;

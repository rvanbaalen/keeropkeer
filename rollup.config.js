import {terser} from "rollup-plugin-terser";
import serve from "rollup-plugin-serve";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

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
        replace({
            exclude: 'node_modules/**',
            preventAssignment: true,
            ENV: JSON.stringify(process.env.NODE_ENV || 'development')
        }),
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

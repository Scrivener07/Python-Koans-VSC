// Imports
//--------------------------------------------------
require('webpack');

/** Core Node.js module for handling file paths. */
const path = require('path');

/** Runs TypeScript type checking in a separate process for faster builds. */
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

/** Webpack plugin to optimize and bundle the Monaco Editor. */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');


// Shared Configuration Template
//--------------------------------------------------

const makeConfig = (argv, { entry, out, target, libraryType, resolve = {} }) => {
    const config = {
        mode: argv.mode,
        devtool: argv.mode === 'development' ? 'source-map' : undefined,
        entry,
        target,
        output: {
            path: path.resolve(__dirname, path.dirname(out)),
            filename: path.basename(out),
        },
        externals: {
            vscode: 'commonjs vscode'
        },
        resolve: {
            extensions: ['.ts', '.js'],
            ...resolve // Merge any additional resolve options
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: 'ts-loader'
                }
            ]
        },
        plugins: [
            new ForkTsCheckerWebpackPlugin()
        ]
    };

    // Handle ES module output vs regular CommonJS output
    if (libraryType === 'module') {
        config.experiments = { outputModule: true };
        config.output.library = { type: 'module' };
    } else {
        config.output.libraryTarget = libraryType || 'commonjs2';
    }

    return config;
};


// Export Configurations
//--------------------------------------------------

module.exports = (env, argv) => [

    // Extension Desktop (vscode)
    //--------------------------------------------------
    // Main extension desktop build for VS Code Node.js.
    // - Has full access to Node.js APIs.
    // - Required: Used for basic functionality.
    makeConfig(argv, {
        entry: './src/extension/extension.ts',
        out: './out/extension/extension.js',
        target: 'node'
    }),


    // Extension Web Browser (webworker)
    //--------------------------------------------------
    // Extension build for web browser (vscode.dev).
    // - Uses polyfills for Node.js modules.
    // - Optional: Used for web browser VS Code (vscode.dev).
    makeConfig(argv, {
        entry: './src/extension/extension.ts',
        out: './out/extension/extension.web.js',
        target: 'webworker',
        resolve: {
            fallback: {
                "child_process": false
            }
        }
    }),


    // Notebook Renderer (web/browser)
    //--------------------------------------------------
    // Extension build for Jupyter notebook renderer.
    // - Required: Used for notebook rendering web/desktop.
    makeConfig(argv, {
        entry: './src/client/notebook/index.ts',
        out: './out/client/notebook/index.js',
        target: 'web',
        libraryType: 'module'
    }),


    // Document Editor (webview)
    //--------------------------------------------------
    // Extension build for custom document editor.
    // - Required: Used for custom editor webviews.
    {
        mode: argv.mode,
        devtool: argv.mode === 'development' ? 'source-map' : undefined,
        entry: {
            'index': './src/client/editor/index.ts'
        },
        target: 'web',
        output: {
            path: path.resolve(__dirname, './out/client/editor'),
            filename: '[name].js',
            // library: {
            //     type: 'module'
            // }
            libraryTarget: 'window'
        },
        // experiments: {
        //     outputModule: true
        // },
        externals: {
            vscode: 'commonjs vscode',
            'monaco-editor': 'monaco'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: 'ts-loader'
                }
            ]
        },
        plugins: [
            new ForkTsCheckerWebpackPlugin(),
            new MonacoWebpackPlugin({
                features: ['!gotoSymbol'],
                languages: ['python']
            })
        ]
    }
];


// Scafolded Configuration (yo code)
//--------------------------------------------------

// WebView - I'm removing this until I get the basic build working again.
// I'll add it back later when the extension builds successfully.

// const makeConfig = (argv, { entry, out, target, library = 'commonjs' }) => ({
//     mode: argv.mode,
//     devtool: argv.mode === 'production' ? false : 'inline-source-map',
//     entry,
//     target,
//     output: {
//         path: path.join(__dirname, path.dirname(out)),
//         filename: path.basename(out),
//         publicPath: '',
//         libraryTarget: library,
//         chunkFormat: library,
//     },
//     externals: {
//         vscode: 'commonjs vscode',
//     },
//     resolve: {
//         extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
//         fallback: { "util": require.resolve("util/") }
//     },
//     experiments: {
//         outputModule: true,
//     },
//     module: {
//         rules: [
//             // Allow importing ts(x) files:
//             {
//                 test: /\.tsx?$/,
//                 loader: 'ts-loader',
//                 options: {
//                     configFile: path.join(path.dirname(entry), 'tsconfig.json'),
//                     // transpileOnly enables hot-module-replacement
//                     transpileOnly: true,
//                     compilerOptions: {
//                         // Overwrite the noEmit from the client's tsconfig
//                         noEmit: false,
//                     },
//                 },
//             },
//             // Allow importing CSS modules:
//             {
//                 test: /\.css$/,
//                 use: [
//                     'style-loader',
//                     {
//                         loader: 'css-loader',
//                         options: {
//                             importLoaders: 1,
//                             modules: true,
//                         },
//                     },
//                 ],
//             },
//         ],
//     },
//     plugins: [
//         new ForkTsCheckerWebpackPlugin({
//             typescript: {
//                 configFile: path.join(path.dirname(entry), 'tsconfig.json'),
//             },
//         }),
//         new DefinePlugin({
//             // Path from the output filename to the output directory
//             __webpack_relative_entrypoint_to_root__: JSON.stringify(
//                 path.posix.relative(path.posix.dirname(`/index.js`), '/'),
//             ),
//             scriptUrl: 'import.meta.url',
//         }),
//     ],
//     infrastructureLogging: {
//         level: "log", // enables logging required for problem matchers
//     },
// });

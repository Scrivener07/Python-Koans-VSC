const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { DefinePlugin } = require('webpack');


const makeConfig = (argv, { entry, out, target, libraryType }) => ({
    mode: argv.mode,
    devtool: argv.mode === 'development' ? 'source-map' : undefined,
    entry,
    target,
    output: {
        path: path.resolve(__dirname, path.dirname(out)),
        filename: path.basename(out),
        libraryTarget: libraryType || 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode'
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
        new ForkTsCheckerWebpackPlugin()
    ]
});


// Export multiple configurations
// This is necessary since the extension and the client have different targets (node and web)
// and different library types (commonjs and module)
module.exports = (env, argv) => [
    // Koan notebook renderer for the web (browser)
    makeConfig(argv, {
        entry: './src/client/index.ts',
        out: './out/client/index.js',
        target: 'web',
        library: 'module'
    }),

    // The extension build for node (vscode)
    makeConfig(argv, {
        entry: './src/extension/extension.ts',
        out: './out/extension/extension.js',
        target: 'node'
    }),

    // The extension build for web (webworker)
    makeConfig(argv, {
        entry: './src/extension/extension.ts',
        out: './out/extension/extension.web.js',
        target: 'webworker'
    }),

    // A koan document webview
    makeConfig(argv, {
        entry: './src/webview/editor.ts',
        // out: './resources/views/editor/editor.js',
        out: './out/webview//editor/editor.js',
        target: 'web',
        // library: 'var'  // Use standard variable exports
        // NOTE: No libraryType needed with `library: 'var' `
        // - current implementation uses default 'commonjs2'.
    }),



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


];

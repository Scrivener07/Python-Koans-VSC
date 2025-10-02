## Run & Build
- https://code.visualstudio.com/api/extension-guides/webview

### Testing the Solution
- Run `npm run watch` to rebuild the *extension*.
- Launch a new VS Code debug session.
- Open a `.koan` file.

### Build Web Pack
- Run `npm run compile` to rebuild the *webpack*.



## Monaco Editor
The [Monaco Editor](https://microsoft.github.io/monaco-editor) is the code editor that powers VS Code.


### Install `monaco-editor`
This is the core editor package that contains all the actual editor functionality, language support, and UI components.
```shell
npm install monaco-editor --save
```


### Install `monaco-editor-webpack-plugin`
This handles the unique bundling requirements of Monaco Editor:
- It correctly includes the worker files (important for syntax highlighting)
- It manages the complex asset loading that Monaco requires
- It configures webpack to properly handle Monaco's AMD modules

Use the `--save-dev` flag to install the Monaco package as a *development dependency* for the webpack.
```shell
npm install monaco-editor-webpack-plugin --save-dev
```

Then update the webpack configuration.
```javascript
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    // ...other webpack config
    {
        // ... ... ...
        plugins: [
            new MonacoWebpackPlugin({
                languages: ['python']
            })
        ]
        // ... ... ...
    }
};
```

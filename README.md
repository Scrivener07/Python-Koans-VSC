# python-koans README

⚠️ Work-in-progress starter code for custom notebook renderers in VS Code. Expect this to change as notebooks matures. ⚠️

This starter includes:

 - 🖥️ TypeScript code to create a simple `NotebookOutputRenderer`
 - 📦 A Webpack build for renderer client code
 - ⚡ Support for hot module reloading and safe boilerplate
 - 🎨 CSS modules support

## Running this Sample

 1. `code-insiders python-koans`: Open the folder in VS Code Insiders
 1. Hit `F5` to build+debug

## Structure

A Notebook Renderer consists of code that runs in the VS Code Extension Host (Node.js), which registers the renderer and passes data into the UI code running inside a WebView (Browser/DOM).

This uses TypeScript project references. There are three projects in the `src` directory:

 - `extension` contains the code running in Node.js extension host. It's compiled with `tsc`.
 - `client` is the UI code, built by Webpack, with access to the DOM.
 - `common` contains code shared between the extension and client.

When you run `watch`, `compile`, or `dev`, we invoke both `tsc` and `webpack` to compile the extension and the client portion of the code.


## Generated

```
? What type of extension do you want to create? New Notebook Renderer (TypeScript)
? What's the name of your extension? Python Koans
? What's the identifier of your extension? python-koans
? What's the description of your extension? Learn Python with interactive coding challenges.
? What's the ID for your renderer? python-koans
? What's your renderer display name? Python Koans
? What mime types will your renderer handle? (separate multiple by commas) x-application/custom-json-output
? Initialize a git repository? Yes
? Which package manager to use? npm
```

```
create python-koans\src\tsconfig-base.json
create python-koans\src\client\css.d.ts
create python-koans\src\client\index.ts
create python-koans\src\client\render.ts
create python-koans\src\client\style.css
create python-koans\src\client\tsconfig.json
create python-koans\src\extension\extension.ts
create python-koans\src\extension\tsconfig.json
create python-koans\src\test\extension.test.ts
create python-koans\src\test\tsconfig.json
create python-koans\.vscode\extensions.json
create python-koans\.vscode\launch.json
create python-koans\.vscode\settings.json
create python-koans\.vscode\tasks.json
create python-koans\tsconfig.json
create python-koans\.vscodeignore
create python-koans\webpack.config.js
create python-koans\eslint.config.mjs
create python-koans\.vscode-test.mjs
create python-koans\package.json
create python-koans\README.md
create python-koans\CHANGELOG.md
create python-koans\example\notebook.ipynb
create python-koans\.gitignore
create python-koans\.gitattributes
```


## Installed Packages
```shell
npm install path-browserify --save-dev
```

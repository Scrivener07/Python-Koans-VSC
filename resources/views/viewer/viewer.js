const vscode = acquireVsCodeApi();

function onClick_MyButton1(myArg) {
    vscode.postMessage({
        command: 'MyButton1',
        myArg: myArg
    });
}

function onClick_MyButton2(myArg) {
    vscode.postMessage({
        command: 'MyButton2',
        myArg: myArg
    });
}

function onClick_MyButton3(myArg) {
    vscode.postMessage({
        command: 'MyButton3',
        myArg: myArg
    });
}

import * as path from 'path';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "domain-graph-vscode" is now active!',
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    'domain-graph-vscode.helloWorld',
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        'Hello World from Domain Graph VSCode Extension!',
      );

      // Create and show panel
      const panel = vscode.window.createWebviewPanel(
        'catCoding',
        'Cat Coding',
        vscode.ViewColumn.One,
        {
          // Enable scripts in the webview
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'dist')),
          ],
        },
      );

      // Get path to resource on disk
      const htmlPath = vscode.Uri.file(
        path.join(context.extensionPath, 'dist', 'index.html'),
      );
      const jsPath = vscode.Uri.file(
        path.join(context.extensionPath, 'dist', 'main.js'),
      );
      const cssPath = vscode.Uri.file(
        path.join(context.extensionPath, 'dist', 'main.css'),
      );

      try {
        // TODO: https://stackoverflow.com/questions/56182144/vscode-extension-webview-external-html-and-css

        const htmlDoc = await vscode.workspace.openTextDocument(htmlPath);

        let html = htmlDoc.getText();

        html = html
          .replace('main.js', panel.webview.asWebviewUri(jsPath).toString())
          .replace('main.css', panel.webview.asWebviewUri(cssPath).toString());

        vscode.window.showInformationMessage(html);

        panel.webview.html = html;
      } catch (ex) {
        console.error(ex);
      }

      // And set its HTML content
      panel.title = 'BRUH.';
    },
  );

  context.subscriptions.push(disposable);
}

// // this method is called when your extension is deactivated
// export function deactivate() {}

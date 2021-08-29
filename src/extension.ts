// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getPreviewDocumentUri, openPreview } from './webview-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "domain-graph-vscode" is now active!',
  );

  vscode.window.showInformationMessage(
    'Hello World from Domain Graph VSCode Extension!',
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'domain-graph-vscode.showPreview',
      (documentUri: vscode.Uri) => {
        openPreview(context, documentUri, vscode.ViewColumn.Beside);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('domain-graph-vscode.showSource', () => {
      const previewDocumentUri = getPreviewDocumentUri();

      if (previewDocumentUri) {
        vscode.workspace
          .openTextDocument(previewDocumentUri)
          .then((document) => {
            vscode.window.showTextDocument(document);
          });
      }
    }),
  );
}

export class DomainGraphPanelSerializer
  implements vscode.WebviewPanelSerializer
{
  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: unknown,
  ): Promise<void> {
    vscode.window.showInformationMessage('Got state! 👍');
    console.log(`Got state: 👍`);
  }
}

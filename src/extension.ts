// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DomainGraphEditorProvider } from './domain-graph-editor-provier';

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

  context.subscriptions.push(DomainGraphEditorProvider.register(context));
  vscode.window.registerWebviewPanelSerializer(
    DomainGraphEditorProvider.viewType,
    new DomainGraphPanelSerializer(),
  );
}

export class DomainGraphPanelSerializer
  implements vscode.WebviewPanelSerializer
{
  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: unknown,
  ): Promise<void> {
    console.log(`Got state: ${state}`);
  }
}

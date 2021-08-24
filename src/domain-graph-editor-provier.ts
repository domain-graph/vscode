import * as path from 'path';
import * as vscode from 'vscode';
import { Message } from './message-types';

export class DomainGraphEditorProvider
  implements vscode.CustomTextEditorProvider
{
  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new DomainGraphEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      DomainGraphEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          // enableFindWidget: true,
          // retainContextWhenHidden: true, // TODO: rehydrate using Redux state
        },
      },
    );
    return providerRegistration;
  }

  public static readonly viewType = 'domain-graph-vscode.domainGraph';

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken,
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'dist')),
      ],
    };
    // TODO: send document content to hydrate initial store
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      document.getText(),
    );

    // TODO: https://github.com/microsoft/vscode-extension-samples/blob/4a0b22cf62265482f892eee9142c37b64eee209a/custom-editor-sample/src/catScratchEditor.ts#L18

    function updateWebview() {
      const text = document.getText();
      console.log({ text });
      const message: Message = {
        type: 'update',
        text: document.getText(),
      };

      webviewPanel.webview.postMessage(message);
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      },
    );

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    updateWebview();
  }

  private getHtmlForWebview(
    webview: vscode.Webview,
    documentText: string,
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'main.js'),
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'main.css'),
    );

    const initialState = encodeURIComponent(JSON.stringify({ documentText }));

    return `
      <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
            <script defer="defer" src="${scriptUri}">
            </script><link href="${styleUri}" rel="stylesheet">
          </head>
          <body>
            <script>window.$INITIAL_STATE="${initialState}";</script>
            <div id="app-root">React has not yet loaded</div>
          </body>
        </html>`;
  }
}

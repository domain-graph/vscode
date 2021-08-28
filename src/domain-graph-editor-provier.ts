import { SaveState } from 'domain-graph';
import * as path from 'path';
import * as vscode from 'vscode';
import { DocumentUpdateMessage, SaveStateMessage } from './message-types';
import { StateProvider } from './state-provider';

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
          retainContextWhenHidden: true, // TODO: prevent the need for this
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
    const stateProvider = StateProvider.create(
      document.uri.toString(),
      this.context.globalState,
    );

    const documentUri = document.uri.toString();

    const initialState = stateProvider.get(documentUri) || null;
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      document.getText(),
      initialState,
    );

    // TODO: https://github.com/microsoft/vscode-extension-samples/blob/4a0b22cf62265482f892eee9142c37b64eee209a/custom-editor-sample/src/catScratchEditor.ts#L18

    function updateWebview() {
      const text = document.getText();
      const state = stateProvider.get(documentUri) || null;
      const message: DocumentUpdateMessage = {
        type: 'update',
        documentUri,
        text,
        state,
      };

      webviewPanel.webview.postMessage(message);
    }

    stateProvider.on('state', (state) => {
      const message: SaveStateMessage = {
        type: 'save-state',
        state,
      };
      webviewPanel.webview.postMessage(message);
    });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      },
    );

    webviewPanel.onDidDispose(() => {
      stateProvider.destroy();
      changeDocumentSubscription.dispose();
    });

    webviewPanel.onDidChangeViewState((e) => {
      e.webviewPanel.active ? stateProvider.resume() : stateProvider.pause();
    });

    webviewPanel.webview.onDidReceiveMessage((msg: SaveStateMessage) => {
      if (msg.state) {
        stateProvider.set(msg.state);
      }
    });

    updateWebview();
  }

  private getHtmlForWebview(
    webview: vscode.Webview,
    documentText: string,
    state: SaveState | null,
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'main.js'),
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'main.css'),
    );

    const initialState = encodeURIComponent(
      JSON.stringify({ documentText, state }),
    );

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

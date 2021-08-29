import { SaveState } from 'domain-graph';
import * as path from 'path';
import * as vscode from 'vscode';
import { DocumentUpdateMessage, SaveStateMessage } from './message-types';
import { StateProvider } from './state-provider';

const panelCache = new Map<string, vscode.WebviewPanel>();

export function getPreviewDocumentUri() {
  return previewDocumentUri;
}

let previewDocumentUri: vscode.Uri | null;

export async function openPreview(
  context: vscode.ExtensionContext,
  documentUri: vscode.Uri,
  viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside,
): Promise<void> {
  const cachedPanel = panelCache.get(documentUri.toString());

  if (cachedPanel) {
    cachedPanel.reveal(viewColumn);
    return;
  }

  const document = await vscode.workspace.openTextDocument(documentUri);

  const fileName = documentUri.toString().split(path.sep).reverse()[0];

  const webviewPanel = vscode.window.createWebviewPanel(
    'domain-graph-vscode.domainGraph',
    `Preview ${fileName}`,
    viewColumn,
    {
      retainContextWhenHidden: true,
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'dist')),
      ],
    },
  );

  const stateProvider = StateProvider.create(
    documentUri.toString(),
    context.globalState,
  );

  const initialState = stateProvider.get(documentUri.toString()) || null;
  webviewPanel.webview.html = getHtmlForWebview(
    context,
    webviewPanel.webview,
    document.getText(),
    initialState,
  );

  // TODO: https://github.com/microsoft/vscode-extension-samples/blob/4a0b22cf62265482f892eee9142c37b64eee209a/custom-editor-sample/src/catScratchEditor.ts#L18

  function updateWebview() {
    const text = document.getText();
    const state = stateProvider.get(documentUri.toString()) || null;
    const message: DocumentUpdateMessage = {
      type: 'update',
      documentUri: documentUri.toString(),
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
    panelCache.delete(documentUri.toString());
  });

  webviewPanel.onDidChangeViewState((e) => {
    e.webviewPanel.active ? stateProvider.resume() : stateProvider.pause();
    vscode.commands.executeCommand(
      'setContext',
      'domainGraphPreviewFocus',
      e.webviewPanel.active,
    );
    previewDocumentUri = e.webviewPanel.active ? documentUri : null;
  });

  webviewPanel.webview.onDidReceiveMessage((msg: SaveStateMessage) => {
    if (msg.state) {
      stateProvider.set(msg.state);
    }
  });

  panelCache.set(documentUri.toString(), webviewPanel);

  updateWebview();
}

function getHtmlForWebview(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  documentText: string,
  state: SaveState | null,
): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'dist', 'main.js'),
  );

  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'dist', 'main.css'),
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

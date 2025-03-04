import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("graphqlSchemaView", provider)
  );
}

export function deactivate() {}

class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'graphqlSchemaView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Zpracování zpráv přicházejících z webview
    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'sendMessage':
          const userMessage = message.text;
          // Načteme všechny module.graphql soubory z workspace
          const graphqlFiles = await this.getGraphQLFiles();
          // Simulované volání Azure AI – zde implementujte skutečné API volání
          const azureResponse = await this.sendToAzureAI(userMessage, graphqlFiles);
          webviewView.webview.postMessage({ command: 'azureResponse', text: azureResponse });
          break;
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="cs">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' vscode-resource:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure AI Chat</title>
    <style>
      /* Použití nativního stylování VS Code */
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-editor-foreground);
        background-color: var(--vscode-editor-background);
        padding: 10px;
      }
      #chat-log {
        height: 300px;
        overflow-y: auto;
        border: 1px solid var(--vscode-editorWidget-border);
        padding: 5px;
        margin-bottom: 10px;
      }
      input, button {
        font-size: var(--vscode-font-size);
      }
    </style>
  </head>
  <body>
    <div id="chat-container">
      <div id="chat-log"></div>
      <input type="text" id="user-input" placeholder="Zadejte popis work itemu" style="width:80%;">
      <button id="send-btn">Odeslat</button>
    </div>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      document.getElementById('send-btn').addEventListener('click', () => {
        const input = document.getElementById('user-input');
        const message = input.value;
        if (message) {
          vscode.postMessage({ command: 'sendMessage', text: message });
          document.getElementById('chat-log').innerHTML += '<div><strong>Vy:</strong> ' + message + '</div>';
          input.value = '';
        }
      });
      window.addEventListener('message', event => {
        const message = event.data;
        if(message.command === 'azureResponse') {
          document.getElementById('chat-log').innerHTML += '<div><strong>Azure AI:</strong> ' + message.text + '</div>';
        }
      });
    </script>
  </body>
</html>`;
  }

  // Vyhledá všechny soubory module.graphql z workspace (vyloučení node_modules)
  private async getGraphQLFiles(): Promise<{ uri: string; content: string }[]> {
    const files = await vscode.workspace.findFiles('**/module.graphql', '**/node_modules/**');
    const results: { uri: string; content: string }[] = [];
    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        results.push({ uri: file.toString(), content: document.getText() });
      } catch (error) {
        console.error('Chyba při načítání souboru', file.fsPath, error);
      }
    }
    return results;
  }

  // Simulovaná funkce volající Azure AI – zde implementujte skutečné API volání
  private async sendToAzureAI(userMessage: string, graphqlFiles: { uri: string; content: string }[]): Promise<string> {
    const payload = { prompt: userMessage, files: graphqlFiles };
    console.log('Odesílám payload do Azure AI:', payload);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'Simulovaná odpověď Azure AI založená na předaných GraphQL schématech.';
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

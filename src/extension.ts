import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const selectedFiles: vscode.Uri[] = [];

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("three-compare.compare", async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: "Select 3 Files to Compare",
        title: "Select exactly 3 files",
      });

      if (!uris || uris.length !== 3) {
        vscode.window.showErrorMessage("Please select exactly 3 files.");
        return;
      }

      openComparePanel(context, uris);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "three-compare.compareSelected",
      async (clickedUri: vscode.Uri, selectedUris: vscode.Uri[]) => {
        const toAdd = selectedUris?.length ? selectedUris : [clickedUri];

        for (const uri of toAdd) {
          if (!selectedFiles.find((f) => f.fsPath === uri.fsPath)) {
            selectedFiles.push(uri);
          }
        }

        if (selectedFiles.length < 3) {
          vscode.window.showInformationMessage(
            `Three Compare: ${selectedFiles.length}/3 files selected. Right-click more files.`,
          );
          return;
        }

        if (selectedFiles.length >= 3) {
          const files = selectedFiles.splice(0, 3);
          selectedFiles.length = 0; // discard any extra files beyond 3
          openComparePanel(context, files);
        }
      },
    ),
  );
}

function openComparePanel(
  context: vscode.ExtensionContext,
  uris: vscode.Uri[],
) {
  // Read files up front so we can embed them in the HTML directly.
  // This avoids the ready-message race condition entirely.
  const fileData = uris.map((uri) => ({
    path: uri.fsPath,
    name: path.basename(uri.fsPath),
    content: fs.readFileSync(uri.fsPath, "utf-8"),
  }));

  const panel = vscode.window.createWebviewPanel(
    "threeCompare",
    `Compare: ${fileData.map((f) => f.name).join(" | ")}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "dist", "webview"),
      ],
      retainContextWhenHidden: true,
    },
  );

  const webviewDistPath = vscode.Uri.joinPath(
    context.extensionUri,
    "dist",
    "webview",
  );

  // Register handler BEFORE setting html so we never miss a "ready" message.
  panel.webview.onDidReceiveMessage(
    (message) => {
      if (message.type === "ready") {
        // Fallback delivery if the HTML-embedded JSON wasn't enough.
        panel.webview.postMessage({ type: "files", files: fileData });
      }
      if (message.type === "openFile") {
        vscode.window.showTextDocument(vscode.Uri.file(message.path));
      }
    },
    undefined,
    context.subscriptions,
  );

  panel.webview.html = buildHtml(panel.webview, webviewDistPath, fileData);
}

interface FilePayload {
  path: string;
  name: string;
  content: string;
}

function buildHtml(
  webview: vscode.Webview,
  distUri: vscode.Uri,
  fileData: FilePayload[],
): string {
  const indexPath = vscode.Uri.joinPath(distUri, "index.html");
  let html = fs.readFileSync(indexPath.fsPath, "utf-8");

  // Rewrite asset paths to vscode-webview:// URIs
  const baseUri = webview.asWebviewUri(distUri).toString();
  html = html.replace(/(src|href)="\.\/([^"]+)"/g, `$1="${baseUri}/$2"`);

  // Remove 'crossorigin' — it blocks loading under the vscode-webview:// scheme
  html = html.replace(/\s+crossorigin(?:="[^"]*")?/g, "");

  // Content Security Policy
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src ${webview.cspSource} 'unsafe-inline'`,
    `img-src ${webview.cspSource} data:`,
    `font-src ${webview.cspSource}`,
  ].join("; ");

  html = html.replace(
    "<head>",
    `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`,
  );

  // Embed file data directly in the HTML so the webview never needs to
  // send a "ready" message — eliminates the timing race condition.
  const safeJson = JSON.stringify(fileData).replace(/</g, "\\u003c");
  html = html.replace(
    "</head>",
    `  <script>window.__THREE_COMPARE_FILES__=${safeJson};</script>\n  </head>`,
  );

  return html;
}

export function deactivate() {}

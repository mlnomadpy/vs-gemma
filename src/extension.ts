import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "code-qa" is now active!');

    let disposable = vscode.commands.registerCommand('vs-gemma.askQuestion', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;

            const selectedCode = document.getText(selection);

            const question = await vscode.window.showInputBox({
                prompt: 'Ask a question about the selected code'
            });

            if (!question) {
                vscode.window.showErrorMessage('No question provided.');
                return;
            }

            try {
                const response = await axios.post('http://localhost:5010/complete', {
                    text: question + "\n\n" + selectedCode,
                    length: 512,
                    temperature: 0.8
                });

                const completion = response.data.completion.text;

                const hover = new vscode.Hover(new vscode.MarkdownString(completion));
                editor.setDecorations(vscode.window.createTextEditorDecorationType({}), [new vscode.Range(selection.start, selection.end)]);
                vscode.languages.registerHoverProvider({ scheme: 'file', language: document.languageId }, {
                    provideHover() {
                        return hover;
                    }
                });

                // Trigger the hover to show up immediately
                vscode.commands.executeCommand('editor.action.showHover');

            } catch (error) {
                vscode.window.showErrorMessage('Error fetching code completion: ' + error);
            }
        } else {
            vscode.window.showErrorMessage('No active editor found.');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

import * as vscode from 'vscode';
import { anotationHandler } from './anotation';
import { applySchemaChange, schemaHandler } from './schema';

// NEW: Command to apply a schema change.
async function applySchemaaChange(change: { file: string; lines: [number, number]; code: string; suggestion: string }) {
	const document = await vscode.workspace.openTextDocument(change.file);
	const editor = await vscode.window.showTextDocument(document);
	const start = change.lines[0] - 1;
	const end = change.lines[1] - 1;
	const startPos = new vscode.Position(start, 0);
	const endLine = document.lineAt(end);
	const endPos = new vscode.Position(end, endLine.text.length);
	const range = new vscode.Range(startPos, endPos);
	await editor.edit(editBuilder => {
		editBuilder.replace(range, change.code);
	});
}

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('graphql-assistant');
	const enableChat = config.get<boolean>('enableChat', true);
	const enableAnnotations = config.get<boolean>('enableAnnotations', true);

	if (enableChat) {
		const graphqlChat = vscode.chat.createChatParticipant('graphql-assistant.chat', schemaHandler);
		graphqlChat.iconPath = vscode.Uri.joinPath(context.extensionUri, './icon.svg');
		context.subscriptions.push(
			vscode.commands.registerCommand('graphql-assistant.applyChange', async (change: any) => {
				await applySchemaChange(change);
			})
		);
	}

	if (enableAnnotations) {
		vscode.commands.registerTextEditorCommand(
			'graphql-assistant.annotate',
			anotationHandler
		);
	}
}

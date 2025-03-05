import * as vscode from 'vscode';
import { getVisibleCodeWithLineNumbers } from '../utils';

const ANNOTATION_PROMPT = `You are a code tutor who helps students learn how to write better code. Your job is to evaluate a block of code that the user gives you and then annotate any lines that could be improved with a brief suggestion and the reason why you are making that suggestion. Only make suggestions when you feel the severity is enough that it will impact the readability and maintainability of the code. For Graphql types looks for common mistakes and also for cases when user have some size query and the upper limit could be bigger than Int size (eg. file size) in those cases use string. Format each suggestion as a single JSON object. It is not necessary to wrap your response in triple backticks. Here is an example of what your response should look like:

{ "line": 1, "suggestion": "You should use enum instead of string for better type safety and readability." }{ "line": 12, "suggestion": "You should use enum instead of string for better type safety and readability." }
`;


function applyDecoration(editor: vscode.TextEditor, line: number, suggestion: string) {
	const decorationType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: ` ${suggestion.substring(0, 25) + '...'}`,
			color: 'grey'
		}
	});

	// get the end of the line with the specified line number
	const lineLength = editor.document.lineAt(line - 1).text.length;
	const range = new vscode.Range(
		new vscode.Position(line - 1, lineLength),
		new vscode.Position(line - 1, lineLength)
	);

	const decoration = { range: range, hoverMessage: suggestion };

	vscode.window.activeTextEditor?.setDecorations(decorationType, [decoration]);
}

async function parseChatResponse(
	chatResponse: vscode.LanguageModelChatResponse,
	textEditor: vscode.TextEditor
) {
	let accumulatedResponse = '';

	for await (const fragment of chatResponse.text) {
		accumulatedResponse += fragment;

		// if the fragment is a }, we can try to parse the whole line
		if (fragment.includes('}')) {
			try {
				const annotation = JSON.parse(accumulatedResponse);
				applyDecoration(textEditor, annotation.line, annotation.suggestion);
				// reset the accumulator for the next line
				accumulatedResponse = '';
			} catch (e) {
				// do nothing
			}
		}
	}
}

export const handler = async (textEditor: vscode.TextEditor) => {
	const codeWithLineNumbers = getVisibleCodeWithLineNumbers(textEditor);

	// select the 4o chat model
	let [model] = await vscode.lm.selectChatModels({
		vendor: 'copilot',
		family: 'gpt-4o'
	});

	if (!model) {
		vscode.window.showErrorMessage('No model found');
		return;
	}

	// init the chat message
	const messages = [
		vscode.LanguageModelChatMessage.User(ANNOTATION_PROMPT),
		vscode.LanguageModelChatMessage.User(codeWithLineNumbers)
	];

	// make sure the model is available
	if (model) {
		// send the messages array to the model and get the response
		let chatResponse = await model.sendRequest(
			messages,
			{},
			new vscode.CancellationTokenSource().token
		);

		// handle chat response
		await parseChatResponse(chatResponse, textEditor);
	}
}

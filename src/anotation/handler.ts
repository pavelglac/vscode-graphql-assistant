import type { TextEditor, LanguageModelChatResponse } from "vscode";
import { Range, Position, window, LanguageModelChatMessage, lm } from "vscode";
import { getVisibleCodeWithLineNumbers } from "../utils";
import { ANNOTATION_PROMPT } from "./prompts";

type DecorationProps = {
  editor: TextEditor;
  line: number;
  suggestion: string;
};

const applyDecoration = ({ editor, line, suggestion }: DecorationProps) => {
  const decorationType = window.createTextEditorDecorationType({
    after: {
      contentText: ` ${suggestion.substring(0, 25) + "..."}`,
      color: "grey",
    },
  });

  const lineLength = editor.document.lineAt(line - 1).text.length;
  const range = new Range(
    new Position(line - 1, lineLength),
    new Position(line - 1, lineLength)
  );

  const decoration = { range: range, hoverMessage: suggestion };

  window.activeTextEditor?.setDecorations(decorationType, [decoration]);
};

const parseChatResponse = async (
  chatResponse: LanguageModelChatResponse,
  textEditor: TextEditor
) => {
  let accumulatedResponse = "";

  for await (const fragment of chatResponse.text) {
    accumulatedResponse += fragment;

    // if the fragment is a }, we can try to parse the whole line
    if (fragment.includes("}")) {
      try {
        const annotation = JSON.parse(accumulatedResponse);
        applyDecoration({
          editor: textEditor,
          line: annotation.line,
          suggestion: annotation.suggestion,
        });
        // reset the accumulator for the next line
        accumulatedResponse = "";
      } catch  {
      }
    }
  }
};

export const handler = async (textEditor: TextEditor) => {
  const codeWithLineNumbers = getVisibleCodeWithLineNumbers(textEditor);

  let [model] = await lm.selectChatModels({
    vendor: "copilot",
    family: "gpt-4o",
  });

  if (!model) {
    window.showErrorMessage("No copilot model found");
    return;
  }

  const messages = [
    ANNOTATION_PROMPT,
    LanguageModelChatMessage.User(codeWithLineNumbers),
  ];

  const chatResponse = await model.sendRequest(messages, {});

  await parseChatResponse(chatResponse, textEditor);
};

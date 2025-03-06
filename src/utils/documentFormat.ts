import type { TextDocument, TextEditor } from "vscode";

type Options = {
  filePath?: string;
  startLine?: number;
  endLine?: number;
  removeComments?: boolean;
};

type SkipLine = [shouldSkip: boolean, isInComment: boolean];

const skipLine = (lineText: string, inCommentBlock: boolean): SkipLine => {
  const trimmedLineText = lineText.trim();
  const commentStartIndex = trimmedLineText.indexOf('"""');
  const isComment = commentStartIndex > -1 || trimmedLineText.startsWith("#");

  if (isComment) {
    const commentEndIndex = trimmedLineText.lastIndexOf('"""');
    const isInlineComment = commentStartIndex !== commentEndIndex;

    if (!isInlineComment) {
      inCommentBlock = !inCommentBlock;
    }
  }

  return [isComment || inCommentBlock, inCommentBlock];
};

export const getFileContentWithLineNumbers = (
  document: TextDocument,
  { filePath, startLine = 0, endLine, removeComments = true }: Options
): string => {
  const lastLine = endLine ? endLine : document.lineCount;

  let code = filePath ? `file: ${filePath}\n` : "";
  let currentLine = startLine;
  let inCommentBlock = false;

  while (currentLine < lastLine) {
    const lineText = document.lineAt(currentLine).text;
    const [shouldSkip, isInComment]: SkipLine = removeComments
      ? skipLine(lineText, inCommentBlock)
      : [false, false];
    inCommentBlock = isInComment;

    if (!shouldSkip) {
      code += `${currentLine + 1}: ${lineText}\n`;
    }

    currentLine++;
  }

  return code;
};

export const getVisibleCodeWithLineNumbers = (textEditor: TextEditor): string =>
  getFileContentWithLineNumbers(textEditor.document, {
    startLine: textEditor.visibleRanges[0].start.line,
    endLine: textEditor.visibleRanges[0].end.line,
  });

import type { TextDocument, TextEditor } from 'vscode';

type Options = {
    filePath?: string;
    startLine?: number;
    endLine?: number;
}

export const getFileContentWithLineNumbers = (document: TextDocument, {
    filePath,
    startLine = 0,
    endLine,
}: Options): string => {
    const lastLine = endLine ? endLine : document.lineCount;

    let code = filePath ? `file: ${filePath}\n` : '';
    let currentLine = startLine;

    while (currentLine < lastLine) {
        code += `${currentLine + 1}: ${document.lineAt(currentLine).text}\n`;
        currentLine++;
    }

    return code;
}

export const getVisibleCodeWithLineNumbers = (textEditor: TextEditor): string => getFileContentWithLineNumbers(textEditor.document, {
    startLine: textEditor.visibleRanges[0].start.line,
    endLine: textEditor.visibleRanges[0].end.line,
})
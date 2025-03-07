import type { ChatResponseStream } from "vscode";
import { Uri } from "vscode";

export const printResponse = (text: string, stream: ChatResponseStream) => {
    // Normalize any "### File:" to "File:"
    const normalizedText = text.replace(/###\s*File:/g, "File:");
    const parts = normalizedText.split(/File:/);

    if (parts[0]) {
        stream.markdown(parts[0]);
    }
    for (let i = 1; i < parts.length; i++) {
        const lines = parts[i].split("\n");
        const filePath = lines.shift()?.trim().replace(/`/g, "");
        if (filePath) {
            stream.anchor(Uri.parse(filePath));
        }
        const rest = lines.join("\n");
        if (rest) {
            stream.markdown(rest);
        }
    }
};

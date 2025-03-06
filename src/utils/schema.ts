import { workspace } from "vscode";
import type {
  CancellationToken,
  ChatResponseStream,
  ChatRequest,
} from "vscode";
import { getFileContentWithLineNumbers } from "./documentFormat";
import {
  getSummaryPrompt,
  getUserPrompt,
  SCHEMA_PROMPT,
} from "../schema/prompts";

const getAllSchemaFiles = async (stream: ChatResponseStream) => {
  stream.progress("Collecting schema files.");
  const schemaFiles = await workspace.findFiles(
    "**/module.graphql",
    "**/node_modules/**"
  );
  return schemaFiles;
};

export const getMergedSchema = async (stream: ChatResponseStream) => {
  const schemaFiles = await getAllSchemaFiles(stream);
  stream.progress(`Merging ${schemaFiles.length} schema files.`);
  let schema = "";
  for (const file of schemaFiles) {
    const document = await workspace.openTextDocument(file);
    schema += getFileContentWithLineNumbers(document, {
      filePath: file.path,
    });
  }
  return schema;
};

export const chunkSchema = (schema: string, request: ChatRequest): string[] => {
  const schemaPromptLength =
    "value" in SCHEMA_PROMPT.content[0]
      ? SCHEMA_PROMPT.content[0].value.length
      : 0;
  const chunkSize = request.model.maxInputTokens - schemaPromptLength;
  const chunks: string[] = [];
  for (let i = 0; i < schema.length; i += chunkSize) {
    chunks.push(schema.slice(i, i + chunkSize));
  }
  return chunks;
};

type SummaryProps = {
  responses: string[];
  request: ChatRequest;
  token: CancellationToken;
  stream: ChatResponseStream;
};

const getSummary = async ({
  responses,
  request,
  token,
  stream,
}: SummaryProps) => {
  const SUMMARY_PROMPT = getSummaryPrompt(responses.join("\n"));
  const USER_PROMPT = getUserPrompt(request.prompt);
  const finalMessages = [SCHEMA_PROMPT, SUMMARY_PROMPT, USER_PROMPT];
  stream.progress("Summarizing responses.");
  const response = await request.model.sendRequest(finalMessages, {}, token);
  let finalText = "";
  for await (const fragment of response.text) {
    finalText += fragment;
  }

  return finalText;
};

export const getResponse = async ({ responses, ...rest }: SummaryProps) => {
  if (responses.length === 1) {
    return responses[0];
  }
  return getSummary({ responses, ...rest });
};

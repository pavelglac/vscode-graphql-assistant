import type {
  CancellationToken,
  ChatResponseStream,
  ChatRequest,
  LanguageModelChatResponse,
} from "vscode";
import { getSummaryPrompt, getUserPrompt, SCHEMA_PROMPT } from "./prompts";

export const getResponseText = async (response: LanguageModelChatResponse) => {
  let text = "";
  for await (const fragment of response.text) {
    text += fragment;
  }

  return text;
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

  return getResponseText(response);
};

export const getDisplayText = async ({ responses, ...rest }: SummaryProps) => {
  if (responses.length === 1) {
    return responses[0];
  }
  return getSummary({ responses, ...rest });
};

import type { ChatRequestHandler } from "vscode";
import { chunkSchema, getMergedSchema, getResponse } from "../utils";
import { printResponse } from "../utils/chatResponse";
import {
  getSchemaPrompt,
  getUserPrompt,
  JSON_ANOTATION_REGEX,
  SCHEMA_PROMPT,
} from "./prompts";
import { getSuggestedChanges } from "./applyChanges";
import { getResponseText } from "./model";

export const handler: ChatRequestHandler = async (
  request,
  context,
  stream,
  token
) => {
  const mergedSchema = await getMergedSchema(stream);
  if (!request.command || request.command === "schema") {
    const getMessages = (schema: string) => [
      SCHEMA_PROMPT,
      getSchemaPrompt(schema),
      getUserPrompt(request.prompt),
    ];

    const schemaChunks = chunkSchema(mergedSchema, request);
    stream.progress(`Sending ${schemaChunks.length} requests.`);
    const chunkPromises = schemaChunks.map(async (chunk) => {
      const chunkResponse = await request.model.sendRequest(
        getMessages(chunk),
        {},
        token
      );
      return getResponseText(chunkResponse);
    });

    const response = await getResponse({
      responses: await Promise.all(chunkPromises),
      request,
      token,
      stream,
    });

    const suggestions = getSuggestedChanges(response);
    const cleanResponse = response.replace(JSON_ANOTATION_REGEX, "");

    printResponse(cleanResponse, stream);
    if (suggestions) {
      stream.button({
        title: "Apply schema changes",
        command: "graphql-assistant.applyChange",
        arguments: [suggestions],
      });
    }
  } else {
    stream.markdown(
      `I'm sorry, I don't understand the command "${request.command}".`
    );
  }
  return;
};

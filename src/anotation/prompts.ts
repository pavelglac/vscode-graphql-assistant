import { LanguageModelChatMessage } from "vscode";

export const ANNOTATION_PROMPT =
  LanguageModelChatMessage.Assistant(`You are a code tutor who helps students learn how to write better code. Your job is to evaluate a block of code that the user gives you and then annotate any lines that could be improved with a brief suggestion and the reason why you are making that suggestion. Only make suggestions when you feel the severity is enough that it will impact the readability and maintainability of the code. For Graphql types looks for common mistakes and also for cases when user have some size query and the upper limit could be bigger than Int size (eg. file size) in those cases use string. Format each suggestion as a single JSON object. It is not necessary to wrap your response in triple backticks. Here is an example of what your response should look like:

{ "line": 1, "suggestion": "You should use enum instead of string for better type safety and readability." }{ "line": 12, "suggestion": "You should use enum instead of string for better type safety and readability." }
`);

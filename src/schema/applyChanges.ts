import { JSON_ANOTATION_REGEX } from "./prompts";

type Suggestion = {
  line: number;
  code: string;
  suggestion: string;
};

type SuggestionsMap = {
  [file: string]: Suggestion[];
};

const groupSuggestionsByFile = (suggestions: any[]) => {
  const fileChangeMap: SuggestionsMap = {};
  for (const suggestion of suggestions) {
    if (suggestion.file && suggestion.line && suggestion.code) {
      if (!fileChangeMap[suggestion.file]) {
        fileChangeMap[suggestion.file] = [];
      }
      fileChangeMap[suggestion.file].push({
        line: suggestion.line,
        code: suggestion.code,
        suggestion: suggestion.suggestion,
      });
    }
  }

  return fileChangeMap;
};

export const getSuggestedChanges = (text: string) => {
  const matches = text.match(JSON_ANOTATION_REGEX);

  if (matches && matches[1]) {
    return JSON.parse(matches[1]);
  }

  return null;
};

export const applySchemaChange = async (changes: any) => {
  const suggestions = getSuggestedChanges(changes);

  return;
};

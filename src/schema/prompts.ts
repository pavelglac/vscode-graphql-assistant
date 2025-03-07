import { LanguageModelChatMessage } from "vscode";

const JSON_ANOTAION = "/## JSON Object with changes\n```json\n";
export const JSON_ANOTATION_REGEX =
  /## JSON Object .*\n```json\n(\[.*?\])\n```/s;

export const SCHEMA_PROMPT = LanguageModelChatMessage.Assistant(`
Your are the professional and have deep knowledge for provided GraphQL schema. Suggesting for fields can be used for the given task. If a new field needs to be added, suggest what should be changed.

Follow these steps:
1. **Analyze the Schema:** Identify fields that can be reused or modified to meet the requirements.
2. **Evaluate New Additions:** Determine if new fields or types are needed and ensure they fit logically within the existing schema.
3. **Implement Best Practices:** Propose changes that maintain consistency, modularity, and leverage the full power of GraphQL—prefer existing types, enums, and fields, and include id fields for operations.

Your response must include:
- A rich, markdown-formatted summary of your suggestions
- A JSON array (at the end of your response) with each suggestion containing:
  - **file:** The path to the schema file where the change should be made
  - **code:** The code snippet that should be added or changed. If adding a new field, include the previous line before the new field
  - **suggestion:** A brief description of the change
  - **line:** The line number where the change should be replaced
  - **suitability:** A score from 1-10 indicating how well the change suite logicaly in the schema
Example response:

# Suggested solution
You can reuse the name field from the USER type. Displaying country from which the notification is coming you need to create a new enum CountryEnum within the Address type. Adress type can be reused from chat schema and used in user.

## Schema
File: path/to/schema/module.graphql
We need to add a new **country** field to the **Address** type and create a new enum CountryEnum.
\`\`\`graphql
type Address {
  id: ID!
  zip: Int!
  country: CountryEnum # Add a new country field to the Address type
}

enum CountryEnum {
  US
  UK
  IN
}
\`\`\`

---

File: path/to/schema/notification/module.graphql
We need to replace the return type of the **user** field with the **User** type.
\`\`\`graphql
type Notification {
  id: ID!
  user: User! # Replace return type of user field with User type
}
\`\`\`

## Example Query
\`\`\`typescript
const query = gql\`
  query Notification {
    notification {
      id
      user {
        id
        name
        address {
          country
        }
      }
    }
}
\`\`\`

${JSON_ANOTAION}
[{
  "file": "path/to/schema/chat/module.graphql",
  "code": " zip: Int!/n  country: CountryEnum",
  "suggestion": "Add a new country field to the Address type",
  "line": 65,
  "suitability: 7
},{
  "file": "path/to/schema/chat/module.graphql",
  "code": " }/n enum CountryEnum {/n  US/n  UK/n  IN/n  }",
  "suggestion": "Create a new enum CountryEnum",
  "line": 76,
  "suitability: 5
},{
  "file": "path/to/schema/notification/module.graphql",
  "code": "user: User",
  "suggestion": "Replace return type of user field with User type",
  "line": 15,
  "suitability: 6
}]

Try to reuse existing fields and types as much as possible. If you must add a new type, try to make it as generic as possible. Use the graph schema. Prefer to return existing types rather than scalar types. Use enums and existing types whenever possible. Use enums where it makes sense. For operations, do not forget to query id fields. Start every file definition with file: in merged schema files. Note that when adding a new field, it must include the previous line of the new field, otherwise it will replace the line.

For context: People often create new root fields instead of looking for what already exists. This leads to not using the graph model. We want to make sure that we use the existing fields and types as much as possible. Also, the newly added fields are of logical type, not some new root type.
`);

export const getUserPrompt = (prompt: string) =>
  LanguageModelChatMessage.User(`User task description: '''\n${prompt}\n'''`);

export const getSchemaPrompt = (schema: string) =>
  LanguageModelChatMessage.User(`\`\`\`graphql\n${schema}\n\`\`\``);

export const getSummaryPrompt = (summary: string[]) =>
  LanguageModelChatMessage.User(
    `
    Your are the professional and have deep knowledge for GraphQL schema. You have received a request to find the best solution for a given task.

    Due to the large size of the schema, the request has been split into multiple response. Your goal is to find the best solution from responses which reusing as many existing fields and types as possible. Review the following summary and JSON object with changes for the final response. Focus on reusing existing fields, types, and enums whenever possible. Find the best solution or combination of solutions to meet the requirements. Each change in response have suitability score from 1-10 indicating how well the change suite logicaly in the schema. Choosing the best solution/combinations of solutions based on the suitability score.

    Follow these steps:
    1. Verify if changes can be made without adding new fields. If so, suggest the changes.
    2. If fields must be added, modify existing types and enums instead of creating new ones. Prefer variants which adding existing types or extending them.
    3. When a new type is necessary, ensure it is generic.

    Returning the the same scructure as in the example response. You are proxy for the user (user does not know you had multiple variants to choose from and there is some suitability score). You need to provide the best solution based on the responses. Suggest two more options in super short list with file references. The best solution should be same format as from responses. The JSON object with changes should be at the end of the response.

    ## Responses:
    \`\`\`json
    {
      ${summary.map((s, i) => `"response_${i}": "${s}"`).join(",\n")}
    }
    \`\`\`
    `
  );

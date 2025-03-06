import { LanguageModelChatMessage } from "vscode";

const JSON_ANOTAION = "/### JSON Object with changes\n```json\n";
export const JSON_ANOTATION_REGEX =
  /### JSON Object .*\n```json\n(\[.*?\])\n```/s;

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
  - **code:** The code snippet that should be added or changed
  - **suggestion:** A brief description of the change
  - **line:** The line number where the change should be replaced
Example response:

# Suggested solution
You can reuse the name field from the USER type. Displaying country from which the notification is coming you need to create a new enum CountryEnum within the Address type. Adress type can be reused from chat schema and used in user.

## Schema
file: path/to/schema/module.graphql
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

file: path/to/schema/notification/module.graphql
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
  "line": 65
},{
  "file": "path/to/schema/chat/module.graphql",
  "code": " enum CountryEnum {/n  US/n  UK/n  IN/n  }",
  "suggestion": "Create a new enum CountryEnum",
  "line": 76
},{
  "file": "path/to/schema/notification/module.graphql",
  "code": "user: User",
  "suggestion": "Replace return type of user field with User type",
  "line": 15
}]

Try to reuse existing fields and types as much as possible. If you must add a new type, try to make it as generic as possible. Use the graph schema. Prefer to return existing types rather than scalar types. Use enums and existing types whenever possible. Use enums where it makes sense. For operations, do not forget to query id fields. Start every file definition with file: in merged schema files. Note that when adding a new field, it must include the previous line of the new field, otherwise it will replace the line.

For context: People often create new root fields instead of looking for what already exists. This leads to not using the graph model. We want to make sure that we use the existing fields and types as much as possible. Also, the newly added fields are of logical type, not some new root type.
`);

export const getUserPrompt = (prompt: string) =>
  LanguageModelChatMessage.User(`User task description: '''\n${prompt}\n'''`);

export const getSchemaPrompt = (schema: string) =>
  LanguageModelChatMessage.User(`\`\`\`graphql\n${schema}\n\`\`\``);

export const getSummaryPrompt = (summary: string) =>
  LanguageModelChatMessage.Assistant(
    `Due to the large size of the schema, the response has been split into multiple parts. Please review the following summary and JSON object with changes for the complete response. Focus on reusing existing fields, types, and enums whenever possible.

    Follow these steps:
    1. Verify if changes can be made without adding new fields.
    2. If fields must be added, modify existing types and enums instead of creating new ones.
    3. Use existing return types if possible.
    4. When a new type is necessary, ensure it is generic.

    Responses: '''\n${summary}\n'''`
  );

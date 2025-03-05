import * as vscode from 'vscode';
import { getAllSchemaFiles } from '../utils';
import { getFileContentWithLineNumbers } from '../utils';
import { getSuggestedChanges } from './applyChanges';

const SCHEMA_PROMPT = `
Your are profesional and have deep knowledge for provided GraphQL schema. Suggesting for fields can be used for the given task. If a new field needs to be added suggest what should be changed.

Step 1 - Analyze the schema and find fields that can be reused or modified to meet the requirements.
Step 2 - Analyze if new fields or types need to be added to the schema.
Step 3 - Find the best way to implement the changes in the schema.

Provide brief summary of changes for chat in rich format markdown as well as JSON object starting with array (this object should be the last in response). For each suggestion with the following fields:
- file: The path to the schema file where the change should be made (taken from the schema file path).
- code: The code that should be added or changed in the schema file.
- suggestion: A brief description of the change that should be made.
- line: Line which should be replace with the code.
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

### JSON Object with changes
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

Try to reused as much as possible the existing fields and types. If you need to add a new type, try to make it as generic as possible. Leverage the graph schema. Prefer to return existing type instead of scalar types. Use enums and already existing types when possible. Use enum where it make sense. For operations do not forget to query for id fields. Each file definition start with file: in merged schema files. Be aware of adding new field it has to include the previous line of the new field otherwise it will replace the line.

For context: People often creating new root fields instead of searching what already exists. That leading to not leveraing the graph model. We want to make sure that we are using the existing fields and types as much as possible. Also the newly added fields are in logical type and not in some new root type.
`

export const handler: vscode.ChatRequestHandler = async (
    request,
    context,
    stream,
    token
) => {
    let schema = "";
    stream.progress('Collecting schema files...');
    const schemaFiles = await getAllSchemaFiles();
    stream.progress('Merging schema files...');
    for (const file of schemaFiles) {
        const document = await vscode.workspace.openTextDocument(file);
        schema += getFileContentWithLineNumbers(document, {
            filePath: file.path
        });
    }
    if (!request.command || request.command === 'schema') {
        const messages = [
            vscode.LanguageModelChatMessage.User(SCHEMA_PROMPT),
            vscode.LanguageModelChatMessage.User(`\`\`\`graphql\n${schema}\n\`\`\``),
            vscode.LanguageModelChatMessage.User(`User task description: '''\n${request.prompt}\n'''`)
        ];
        
        stream.progress('Sending schema to model...');
        const chatResponse = await request.model.sendRequest(messages, {}, token);
        let responseText = '';
        stream.progress('Receiving response...');
        for await (const fragment of chatResponse.text) {
            responseText += fragment;
        }
        const suggestions = getSuggestedChanges(responseText);
        const cleanResponse = responseText.replace(/### JSON Object with changes\n```json\n(\[.*?\])\n```/s, '');

        stream.markdown(cleanResponse);
        if(suggestions){
            stream.button({
                title: 'Apply schema changes',
                command: 'graphql-assistant.applyChange',
                arguments: [suggestions]
            });
        }
    } else {
        stream.markdown(`I'm sorry, I don't understand the command "${request.command}".`);
    }
    return;
};
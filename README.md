# GraphQL Assistant

GraphQL Assistant is an AI-powered assistant for GraphQL schema design. It provides features like GraphQL chat and inline annotations to help you design and manage your GraphQL schemas more efficiently.

## Features

### GraphQL Chat
- Interact with the AI assistant to get suggestions and improvements for your GraphQL schema.
- Use commands like "Apply schema changes" to automatically apply suggested changes to your schema files.

### Inline Annotations
- Get inline annotations in your code editor with suggestions for improving your GraphQL schema.
- Use the "Toggle GraphQL Annotations" command to enable or disable inline annotations.

## Requirements

- Visual Studio Code version 1.97.0 or higher
- Node.js and npm installed on your machine

## Installation

1. Install Visual Studio Code from [here](https://code.visualstudio.com/).
2. Install Node.js and npm from [here](https://nodejs.org/).
3. Clone this repository and navigate to the project directory.
4. Run `npm install` to install the dependencies.
5. Open the project in Visual Studio Code.

## Extension Settings

This extension contributes the following settings:

- `graphql-assistant.enableChat`: Enable/disable the GraphQL Chat feature.
- `graphql-assistant.enableAnnotations`: Enable/disable inline GraphQL annotations.
- `graphql-assistant.schemaIncludePattern`: Glob pattern for GraphQL schema files.
- `graphql-assistant.schemaExcludePattern`: Glob pattern for excluding GraphQL schema files.

## Release Notes

### 0.0.1

- Initial release of GraphQL Assistant

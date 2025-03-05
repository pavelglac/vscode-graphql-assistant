import * as vscode from 'vscode';

export const getAllSchemaFiles = async () => {
    const schemaFiles = await vscode.workspace.findFiles('**/module.graphql', "**/node_modules/**");
    return schemaFiles;
}
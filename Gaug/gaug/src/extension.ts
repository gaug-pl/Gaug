import * as vscode from 'vscode';

const BUILTIN_TYPES = [ 
	'string', 
	'dict', 'dictionary', 
	'task', 
	'list', 
	'number', 
	'null', 
	'boolean' 
];

// Define the built-in libraries and their methods/constants
const BUILTIN_LIBRARIES: Record<string, { label: string; kind: vscode.CompletionItemKind; detail: string; snippet?: string }[]> = {
    math: [
        { label: 'sqrt', kind: vscode.CompletionItemKind.Method, detail: 'math.sqrt(number)', snippet: 'sqrt(${1:number})' },
        { label: 'abs', kind: vscode.CompletionItemKind.Method, detail: 'math.abs(number)', snippet: 'abs(${1:number})' },
        { label: 'min', kind: vscode.CompletionItemKind.Method, detail: 'math.min(a, b)', snippet: 'min(${1:a},${2:b})' },
        { label: 'max', kind: vscode.CompletionItemKind.Method, detail: 'math.max(a, b)', snippet: 'max(${1:a},${2:b})' },
        { label: 'inf', kind: vscode.CompletionItemKind.Constant, detail: 'math.inf' },
        { label: 'pi', kind: vscode.CompletionItemKind.Constant, detail: 'math.pi' }
    ],
    list: [
        { label: 'new', kind: vscode.CompletionItemKind.Method, detail: 'list.new()', snippet: 'new()' },
        { label: 'push', kind: vscode.CompletionItemKind.Method, detail: 'list.push(list, item)', snippet: 'push(${1:list},${2:item})' },
        { label: 'get', kind: vscode.CompletionItemKind.Method, detail: 'list.get(list, index)', snippet: 'get(${1:list},${2:index})' }
    ],
    gc: [
        { label: 'enable', kind: vscode.CompletionItemKind.Method, detail: 'gc.enable()', snippet: 'enable()' },
        { label: 'disable', kind: vscode.CompletionItemKind.Method, detail: 'gc.disable()', snippet: 'disable()' },
        { label: 'collect', kind: vscode.CompletionItemKind.Method, detail: 'gc.collect()', snippet: 'collect()' },
        { label: 'count', kind: vscode.CompletionItemKind.Method, detail: 'gc.count()', snippet: 'count()' },
        { label: 'setthreshold', kind: vscode.CompletionItemKind.Method, detail: 'gc.setthreshold(threshold)', snippet: 'setthreshold(${1:threshold})' },
        { label: 'getthreshold', kind: vscode.CompletionItemKind.Method, detail: 'gc.getthreshold()', snippet: 'getthreshold()' }
    ],
    dict: [
        { label: 'has', kind: vscode.CompletionItemKind.Method, detail: 'dict.has(dict, key)', snippet: 'has(${1:dict},${2:key})' },
        { label: 'keys', kind: vscode.CompletionItemKind.Method, detail: 'dict.keys(dict)', snippet: 'keys(${1:dict})' }
    ],
    http: [
        { label: 'get', kind: vscode.CompletionItemKind.Method, detail: 'http.get(url)', snippet: 'get(${1:url})' },
        { label: 'post', kind: vscode.CompletionItemKind.Method, detail: 'http.post(url, body)', snippet: 'post(${1:url},${2:body})' },
        { label: 'request', kind: vscode.CompletionItemKind.Method, detail: 'http.request(options)', snippet: 'request(${1:options})' }
    ],
    json: [
        { label: 'parse', kind: vscode.CompletionItemKind.Method, detail: 'json.parse(str)', snippet: 'parse(${1:str})' },
        { label: 'stringify', kind: vscode.CompletionItemKind.Method, detail: 'json.stringify(value)', snippet: 'stringify(${1:value})' }
    ],
    task: [
        { label: 'await', kind: vscode.CompletionItemKind.Method, detail: 'task.await(task)', snippet: 'await(${1:task})' },
        { label: 'done', kind: vscode.CompletionItemKind.Method, detail: 'task.done(task)', snippet: 'done(${1:task})' }
    ]
};

// export function activate(context: vscode.ExtensionContext) {
//     const provider = vscode.languages.registerCompletionItemProvider(
//         'gaug',
//         {
//             provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
//                 const linePrefix = document.lineAt(position).text.substr(0, position.character);

//                 // Check if user typed "libraryName." (e.g., "math.")
//                 const dotMatch = linePrefix.match(/([A-Za-z_]\w*)\.\s*$/);

//                 if (dotMatch) {
//                     const moduleName = dotMatch[1];
//                     if (BUILTIN_LIBRARIES[moduleName]) {
//                         return BUILTIN_LIBRARIES[moduleName].map(item => {
//                             const completion = new vscode.CompletionItem(item.label, item.kind);
//                             completion.detail = item.detail;
//                             if (item.snippet) {
//                                 completion.insertText = new vscode.SnippetString(item.snippet);
//                             }
//                             return completion;
//                         });
//                     }
//                     return [];
//                 }

//                 // If not typing after a dot, show Top-Level Suggestions (Modules + User variables)
//                 const completions: vscode.CompletionItem[] = [];

//                 // Add built-in library module names (e.g., math, list, http)
//                 for (const modName of Object.keys(BUILTIN_LIBRARIES)) {
//                     const item = new vscode.CompletionItem(modName, vscode.CompletionItemKind.Module);
//                     item.detail = `${modName} library`;
//                     completions.push(item);
//                 }

//                 // Add user-defined variables
//                 const text = document.getText();
// 				const variableRegex = /(?:var|const)\s+([A-Za-z_]\w*)(?:\s*>>>\s*([A-Za-z_]\w*))?/g;
// 				const foundVariables = new Set<string>();

// 				let match;
// 				while ((match = variableRegex.exec(text)) !== null) {
//     				const variableName = match[1];
//     				const variableType = match[2]; // Will be "string", "number", "task", etc.

//     				if (!foundVariables.has(variableName)) {
//         				foundVariables.add(variableName);
        
//         				const item = new vscode.CompletionItem(
//             				variableName, 
//            	 				vscode.CompletionItemKind.Variable
//         				);

//         				if (variableType) {
//             				item.detail = `(variable) ${variableType}`;
//         				} else {
//             				item.detail = `(variable)`;
//         				}

//         				item.documentation = new vscode.MarkdownString(
//             				`User-defined variable \`${variableName}\` of type \`${variableType || 'unknown'}\`.`
//         				);

//         				completions.push(item);
//     				}
// 				}

//                 return completions;
//             }
//         },
//         '.' // <-- Registers dot as a trigger character
//     );

//     context.subscriptions.push(provider);
// }

// export function deactivate() {}



export function activate(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerCompletionItemProvider(
        'gaug',
        {
            provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position
            ) {
                const line = document.lineAt(position.line).text;
                const linePrefix = line.substring(0, position.character);
                const textBeforeCursor = linePrefix;

                // Check if the user is typing a type:
                //
                // var x >>> |
                // var x >>> str|
                //
                // function(x: |
                // function(x: str|
                const isTypeContext =
                    /(?:>>>\s*|:\s*)[A-Za-z_]*$/.test(textBeforeCursor);

                // Check if user typed "libraryName."
                // e.g. "math."
                const dotMatch = linePrefix.match(/([A-Za-z_]\w*)\.\s*$/);

                /*
                 * ---------------------------------------------------------
                 * DOT COMPLETIONS
                 * ---------------------------------------------------------
                 */
                if (dotMatch) {
                    const moduleName = dotMatch[1];

                    if (BUILTIN_LIBRARIES[moduleName]) {
                        return BUILTIN_LIBRARIES[moduleName].map(item => {
                            const completion = new vscode.CompletionItem(
                                item.label,
                                item.kind
                            );

                            completion.detail = item.detail;

                            if (item.snippet) {
                                completion.insertText =
                                    new vscode.SnippetString(item.snippet);
                            }

                            return completion;
                        });
                    }

                    return [];
                }

                /*
                 * ---------------------------------------------------------
                 * TYPE COMPLETIONS
                 * ---------------------------------------------------------
                 */
                if (isTypeContext) {
                    const typeCompletions: vscode.CompletionItem[] = [];

                    // Built-in Gaug types
                    for (const typeName of BUILTIN_TYPES) {
                        const item = new vscode.CompletionItem(
                            typeName,
                            vscode.CompletionItemKind.TypeParameter
                        );

                        item.detail = 'Gaug built-in type';

                        typeCompletions.push(item);
                    }

                    // Find custom types:
                    //
                    // type new Player
                    // type modify NPC
                    //
                    const customTypeRegex =
                        /\btype\s+(?:new|modify)\s+([A-Za-z_]\w*)\b/g;

                    const source = document.getText();
                    const seen = new Set<string>(BUILTIN_TYPES);

                    let typeMatch: RegExpExecArray | null;

                    while ((typeMatch = customTypeRegex.exec(source)) !== null) {
                        const typeName = typeMatch[1];

                        if (seen.has(typeName)) {
                            continue;
                        }

                        seen.add(typeName);

                        const item = new vscode.CompletionItem(
                            typeName,
                            vscode.CompletionItemKind.Struct
                        );

                        item.detail = 'User-defined Gaug type';

                        typeCompletions.push(item);
                    }

                    return typeCompletions;
                }

                /*
                 * ---------------------------------------------------------
                 * NORMAL TOP-LEVEL COMPLETIONS
                 * ---------------------------------------------------------
                 */
                const completions: vscode.CompletionItem[] = [];

                // Add built-in library module names
                for (const modName of Object.keys(BUILTIN_LIBRARIES)) {
                    const item = new vscode.CompletionItem(
                        modName,
                        vscode.CompletionItemKind.Module
                    );

                    item.detail = `${modName} library`;
                    completions.push(item);
                }

                // Add user-defined variables
                const text = document.getText();

                const variableRegex =
                    /(?:var|const)\s+([A-Za-z_]\w*)(?:\s*>>>\s*([A-Za-z_]\w*))?/g;

                const foundVariables = new Set<string>();

                let match: RegExpExecArray | null;

                while ((match = variableRegex.exec(text)) !== null) {
                    const variableName = match[1];
                    const variableType = match[2];

                    if (foundVariables.has(variableName)) {
                        continue;
                    }

                    foundVariables.add(variableName);

                    const item = new vscode.CompletionItem(
                        variableName,
                        vscode.CompletionItemKind.Variable
                    );

                    if (variableType) {
                        item.detail = `(variable) ${variableType}`;
                    } else {
                        item.detail = `(variable)`;
                    }

                    item.documentation = new vscode.MarkdownString(
                        `User-defined variable \`${variableName}\` of type \`${variableType || 'unknown'}\`.`
                    );

                    completions.push(item);
                }

                return completions;
            }
        },

        '.' // Trigger completions after '.'
    );

    context.subscriptions.push(provider);
}

export function deactivate() {}
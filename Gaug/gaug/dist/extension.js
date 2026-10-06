"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var BUILTIN_TYPES = [
  "string",
  "dict",
  "dictionary",
  "task",
  "list",
  "number",
  "null",
  "boolean"
];
var BUILTIN_LIBRARIES = {
  math: [
    { label: "sqrt", kind: vscode.CompletionItemKind.Method, detail: "math.sqrt(number)", snippet: "sqrt(${1:number})" },
    { label: "abs", kind: vscode.CompletionItemKind.Method, detail: "math.abs(number)", snippet: "abs(${1:number})" },
    { label: "min", kind: vscode.CompletionItemKind.Method, detail: "math.min(a, b)", snippet: "min(${1:a},${2:b})" },
    { label: "max", kind: vscode.CompletionItemKind.Method, detail: "math.max(a, b)", snippet: "max(${1:a},${2:b})" },
    { label: "inf", kind: vscode.CompletionItemKind.Constant, detail: "math.inf" },
    { label: "pi", kind: vscode.CompletionItemKind.Constant, detail: "math.pi" }
  ],
  list: [
    { label: "new", kind: vscode.CompletionItemKind.Method, detail: "list.new()", snippet: "new()" },
    { label: "push", kind: vscode.CompletionItemKind.Method, detail: "list.push(list, item)", snippet: "push(${1:list},${2:item})" },
    { label: "get", kind: vscode.CompletionItemKind.Method, detail: "list.get(list, index)", snippet: "get(${1:list},${2:index})" }
  ],
  gc: [
    { label: "enable", kind: vscode.CompletionItemKind.Method, detail: "gc.enable()", snippet: "enable()" },
    { label: "disable", kind: vscode.CompletionItemKind.Method, detail: "gc.disable()", snippet: "disable()" },
    { label: "collect", kind: vscode.CompletionItemKind.Method, detail: "gc.collect()", snippet: "collect()" },
    { label: "count", kind: vscode.CompletionItemKind.Method, detail: "gc.count()", snippet: "count()" },
    { label: "setthreshold", kind: vscode.CompletionItemKind.Method, detail: "gc.setthreshold(threshold)", snippet: "setthreshold(${1:threshold})" },
    { label: "getthreshold", kind: vscode.CompletionItemKind.Method, detail: "gc.getthreshold()", snippet: "getthreshold()" }
  ],
  dict: [
    { label: "has", kind: vscode.CompletionItemKind.Method, detail: "dict.has(dict, key)", snippet: "has(${1:dict},${2:key})" },
    { label: "keys", kind: vscode.CompletionItemKind.Method, detail: "dict.keys(dict)", snippet: "keys(${1:dict})" }
  ],
  http: [
    { label: "get", kind: vscode.CompletionItemKind.Method, detail: "http.get(url)", snippet: "get(${1:url})" },
    { label: "post", kind: vscode.CompletionItemKind.Method, detail: "http.post(url, body)", snippet: "post(${1:url},${2:body})" },
    { label: "request", kind: vscode.CompletionItemKind.Method, detail: "http.request(options)", snippet: "request(${1:options})" }
  ],
  json: [
    { label: "parse", kind: vscode.CompletionItemKind.Method, detail: "json.parse(str)", snippet: "parse(${1:str})" },
    { label: "stringify", kind: vscode.CompletionItemKind.Method, detail: "json.stringify(value)", snippet: "stringify(${1:value})" }
  ],
  task: [
    { label: "await", kind: vscode.CompletionItemKind.Method, detail: "task.await(task)", snippet: "await(${1:task})" },
    { label: "done", kind: vscode.CompletionItemKind.Method, detail: "task.done(task)", snippet: "done(${1:task})" }
  ]
};
function activate(context) {
  const provider = vscode.languages.registerCompletionItemProvider(
    "gaug",
    {
      provideCompletionItems(document, position) {
        const line = document.lineAt(position.line).text;
        const linePrefix = line.substring(0, position.character);
        const textBeforeCursor = linePrefix;
        const isTypeContext = /(?:>>>\s*|:\s*)[A-Za-z_]*$/.test(textBeforeCursor);
        const dotMatch = linePrefix.match(/([A-Za-z_]\w*)\.\s*$/);
        if (dotMatch) {
          const moduleName = dotMatch[1];
          if (BUILTIN_LIBRARIES[moduleName]) {
            return BUILTIN_LIBRARIES[moduleName].map((item) => {
              const completion = new vscode.CompletionItem(
                item.label,
                item.kind
              );
              completion.detail = item.detail;
              if (item.snippet) {
                completion.insertText = new vscode.SnippetString(item.snippet);
              }
              return completion;
            });
          }
          return [];
        }
        if (isTypeContext) {
          const typeCompletions = [];
          for (const typeName of BUILTIN_TYPES) {
            const item = new vscode.CompletionItem(
              typeName,
              vscode.CompletionItemKind.TypeParameter
            );
            item.detail = "Gaug built-in type";
            typeCompletions.push(item);
          }
          const customTypeRegex = /\btype\s+(?:new|modify)\s+([A-Za-z_]\w*)\b/g;
          const source = document.getText();
          const seen = new Set(BUILTIN_TYPES);
          let typeMatch;
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
            item.detail = "User-defined Gaug type";
            typeCompletions.push(item);
          }
          return typeCompletions;
        }
        const completions = [];
        for (const modName of Object.keys(BUILTIN_LIBRARIES)) {
          const item = new vscode.CompletionItem(
            modName,
            vscode.CompletionItemKind.Module
          );
          item.detail = `${modName} library`;
          completions.push(item);
        }
        const text = document.getText();
        const variableRegex = /(?:var|const)\s+([A-Za-z_]\w*)(?:\s*>>>\s*([A-Za-z_]\w*))?/g;
        const foundVariables = /* @__PURE__ */ new Set();
        let match;
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
            `User-defined variable \`${variableName}\` of type \`${variableType || "unknown"}\`.`
          );
          completions.push(item);
        }
        return completions;
      }
    },
    "."
    // Trigger completions after '.'
  );
  context.subscriptions.push(provider);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map

import React, { useEffect, useRef } from "react";

import Editor, {
  OnChange,
  OnMount,
  useMonaco,
  Monaco,
} from "@monaco-editor/react";
import { Position, editor } from "monaco-editor";
import * as S from "@crianonim/screept";

function setUpLanguage(monaco: Monaco, environment: S.Environment) {
  const keywords = ["PRINT", "IF", "THEN", "RND", "FUNC", "PROC", "RUN"];

  monaco.languages.register({ id: "screept" });
  monaco.languages.registerCompletionItemProvider("screept", {
    provideCompletionItems: (model, position: Position) => {
      const suggestions = [
        ...keywords.map((k) => {
          return {
            label: k,
            insertText: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: model.getWordUntilPosition(position).startColumn,
              endColumn: model.getWordUntilPosition(position).endColumn,
            },
          };
        }),
        ...Object.keys(environment.vars).map((k) => ({
          label: k,
          insertText: k,
          kind: monaco.languages.CompletionItemKind.Variable,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: model.getWordUntilPosition(position).startColumn,
            endColumn: model.getWordUntilPosition(position).endColumn,
          },
        })),
        ...Object.keys(environment.procedures).map((k) => ({
          label: k,
          insertText: k,
          kind: monaco.languages.CompletionItemKind.Function,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: model.getWordUntilPosition(position).startColumn,
            endColumn: model.getWordUntilPosition(position).endColumn,
          },
        })),
      ];
      //   console.log({ suggestions });
      return { suggestions };
    },
  });
  monaco.languages.setMonarchTokensProvider("screept", {
    keywords,
    tokenizer: {
      root: [
        [
          /@?[a-zA-Z][\w$]*/,
          {
            cases: {
              "@keywords": "keyword",
              "@default": "variable",
            },
          },
        ],
        [/".*?"/, "string"],
      ],
    },
  });
}

type ScreeptEditorProps = {
  onChange: OnChange;
  initialValue: string;
  environment: S.Environment;
  singleLine?: Boolean;
};

function ScreeptEditor({
  onChange,
  initialValue,
  environment,
  singleLine,
}: ScreeptEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  console.log({ singleLine });
  function handleEditorDidMount(
    editor: editor.IStandaloneCodeEditor,
    m: Monaco
  ) {
    editorRef.current = editor;
    if (m !== monaco) {
      console.log("Brand new Monaco!", m, monaco);
      setUpLanguage(m, environment);
    }
  }
  /// TODO Show errors
  //   if (editorRef.current && monaco && editorRef.current.getModel()) {
  //     const model = editorRef.current.getModel();
  //     if (model)
  //       monaco.editor.setModelMarkers(model, "owner", [
  //         {
  //           severity: monaco.MarkerSeverity.Error,
  //           startColumn: 1,
  //           endColumn: model.getFullModelRange().endColumn,
  //           startLineNumber: 1,
  //           endLineNumber: model.getLineCount(),
  //           message: "Bad screept",
  //         },
  //       ]);
  //   }

  //   useEffect(() => {
  //     const keywords = ["PRINT", "IF", "THEN", "RND", "FUNC", "PROC", "RUN"];
  //     if (monaco) {
  //       monaco.languages.register({ id: "screept" });
  //       monaco.languages.registerCompletionItemProvider("screept", {
  //         provideCompletionItems: (model, position: Position) => {
  //           const suggestions = [
  //             ...keywords.map((k) => {
  //               return {
  //                 label: k,
  //                 insertText: k,
  //                 kind: monaco.languages.CompletionItemKind.Keyword,
  //                 range: {
  //                   startLineNumber: position.lineNumber,
  //                   endLineNumber: position.lineNumber,
  //                   startColumn: model.getWordUntilPosition(position).startColumn,
  //                   endColumn: model.getWordUntilPosition(position).endColumn,
  //                 },
  //               };
  //             }),
  //             ...Object.keys(environment.vars).map((k) => ({
  //               label: k,
  //               insertText: k,
  //               kind: monaco.languages.CompletionItemKind.Variable,
  //               range: {
  //                 startLineNumber: position.lineNumber,
  //                 endLineNumber: position.lineNumber,
  //                 startColumn: model.getWordUntilPosition(position).startColumn,
  //                 endColumn: model.getWordUntilPosition(position).endColumn,
  //               },
  //             })),
  //             ...Object.keys(environment.procedures).map((k) => ({
  //               label: k,
  //               insertText: k,
  //               kind: monaco.languages.CompletionItemKind.Function,
  //               range: {
  //                 startLineNumber: position.lineNumber,
  //                 endLineNumber: position.lineNumber,
  //                 startColumn: model.getWordUntilPosition(position).startColumn,
  //                 endColumn: model.getWordUntilPosition(position).endColumn,
  //               },
  //             })),
  //           ];
  //           console.log({ suggestions });
  //           return { suggestions };
  //         },
  //       });
  //       monaco.languages.setMonarchTokensProvider("screept", {
  //         keywords,
  //         tokenizer: {
  //           root: [
  //             [
  //               /@?[a-zA-Z][\w$]*/,
  //               {
  //                 cases: {
  //                   "@keywords": "keyword",
  //                   "@default": "variable",
  //                 },
  //               },
  //             ],
  //             [/".*?"/, "string"],
  //           ],
  //         },
  //       });
  //       console.log("here is the monaco instance:", monaco);
  //     }
  //   }, [monaco]);
  const options: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    wordWrap: "wordWrapColumn",
    lineNumbers: singleLine ? "off" : "on",
  };
  return (
    <Editor
      height={singleLine ? "3.5rem" : "100px"}
      defaultLanguage="screept"
      defaultValue={initialValue}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={options}
    />
  );
}

export default ScreeptEditor;

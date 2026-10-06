import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { LANGUAGE } from "../config.js";
import "../monaco-workers.js";

export interface EditorProps {
  initialValue?: string;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

export const Editor: React.FC<EditorProps> = ({
  initialValue = "// Welcome to Collab Editor\nconst greeting: string = 'Hello, real-time world!';\nconsole.log(greeting);\n",
  onMount,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value: initialValue,
      language: LANGUAGE,
      theme: "vs-dark",
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 14,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      tabSize: 2,
      scrollBeyondLastLine: false,
      readOnly: false,
    });

    editorRef.current = editor;
    if (onMount) {
      onMount(editor);
    }

    return () => {
      editor.dispose();
      editorRef.current = null;
    };
    // Editor is created once and disposed on unmount; intentionally ignoring
    // initialValue and onMount in the dep array — re-creating on every prop change
    // would break the y-monaco binding we add in P1-S4.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-testid="monaco-editor-container"
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
};

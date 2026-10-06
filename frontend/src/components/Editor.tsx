/**
 * Editor — Monaco editor bound to a Yjs Y.Text via y-monaco.
 *
 * The binding owns the document content; never set editor value manually.
 * Destroy order on unmount: binding first, then provider (handled by caller).
 */
import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import { LANGUAGE } from "../config.js";
import "../monaco-workers.js";

export interface EditorProps {
  ytext: Y.Text;
  awareness: Awareness;
}

export const Editor: React.FC<EditorProps> = ({ ytext, awareness }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Keep refs so the cleanup closure always sees the latest instances even
  // after React re-renders between mount and unmount.
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      // Do NOT pass `value` — the MonacoBinding owns the content.
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

    const model = editor.getModel();
    if (model) {
      // MonacoBinding(ytext, monacoModel, editors?, awareness?)
      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        awareness,
      );
      bindingRef.current = binding;
    }

    return () => {
      // Destroy binding before the editor so y-monaco can clean up its
      // model observers and decorations cleanly.
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // create once; ytext/awareness are stable refs from useCollab

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

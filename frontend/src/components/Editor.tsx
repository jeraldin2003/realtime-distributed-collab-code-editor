/**
 * Editor — Monaco editor bound to a Yjs Y.Text via y-monaco.
 *
 * The Monaco editor instance is created once and lives for the component's
 * lifetime. The MonacoBinding is recreated whenever ytext or awareness changes
 * (i.e. when the user switches files). The editor DOM never remounts, so
 * there is no flicker between file switches.
 *
 * Destroy order on binding swap: old binding first, then create new one.
 * Monaco language is updated via setModelLanguage on each ytext change.
 */
import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import "../monaco-workers.js";

export interface EditorProps {
  ytext: Y.Text;
  awareness: Awareness;
  /** Monaco language id (e.g. "typescript", "javascript"). */
  language: string;
}

export const Editor: React.FC<EditorProps> = ({ ytext, awareness, language }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Effect 1: create the Monaco editor once and dispose on unmount.
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      // Do NOT pass `value` — the MonacoBinding owns the content.
      language,
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

    return () => {
      // Binding is already cleaned up by effect 2's cleanup before this runs.
      editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // create once per mount

  // Effect 2: (re)bind to ytext and update language whenever they change.
  // This fires on mount (after effect 1) and again on every file switch.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Update the model language so syntax highlighting matches the new file.
    monaco.editor.setModelLanguage(model, language);

    // Destroy the old binding before creating the new one to avoid double
    // observers on the ytext / model.
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const binding = new MonacoBinding(ytext, model, new Set([editor]), awareness);
    bindingRef.current = binding;

    return () => {
      binding.destroy();
      bindingRef.current = null;
    };
  }, [ytext, awareness, language]); // rebind when file switches

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

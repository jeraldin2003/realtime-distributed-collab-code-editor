/**
 * NewFileInput — inline file-name input with validation.
 *
 * Renders an input field at the bottom of the file list. On Enter or blur,
 * validates and calls onConfirm(name). On Escape, calls onCancel.
 * Shows an inline error message for invalid names.
 */
import React, { useEffect, useRef, useState } from "react";
import { validateFileName, VALIDATION_MESSAGES } from "../collab/fileIndex.js";
import type { FileEntry } from "../collab/useIndex.js";

export interface NewFileInputProps {
  /** Existing files, used for duplicate-name and max-files checks. */
  existingFiles: FileEntry[];
  /** Parent folder id for the new item. null = root. */
  parentId?: string | null;
  /** Type of entry to create. Defaults to "file". */
  entryType?: "file" | "folder";
  /** Called with the trimmed name when the user confirms a valid name. */
  onConfirm: (name: string) => void;
  /** Called when the user cancels (Escape or clicking away with empty input). */
  onCancel: () => void;
}

export const NewFileInput: React.FC<NewFileInputProps> = ({
  existingFiles,
  parentId = null,
  entryType = "file",
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const tryConfirm = (raw: string) => {
    const name = raw.trim();
    const err = validateFileName(name, existingFiles, undefined, parentId);
    if (err) {
      setError(VALIDATION_MESSAGES[err]);
      return;
    }
    setError(null);
    onConfirm(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryConfirm(value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    if (value.trim() === "") {
      onCancel();
    } else {
      tryConfirm(value);
    }
  };

  return (
    <div
      data-testid="new-file-input-container"
      style={{ padding: "4px 8px 4px 16px" }}
    >
      <input
        ref={inputRef}
        data-testid="new-file-input"
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null); // clear error on typing
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={entryType === "folder" ? "folder-name" : "filename.ts"}
        aria-label={entryType === "folder" ? "New folder name" : "New file name"}
        aria-describedby={error ? "new-file-error" : undefined}
        style={{
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#3c3c3c",
          border: error ? "1px solid #f44336" : "1px solid #555555",
          borderRadius: "3px",
          color: "#cccccc",
          fontSize: "12px",
          fontFamily: "monospace",
          padding: "3px 6px",
          outline: "none",
        }}
      />
      {error && (
        <div
          id="new-file-error"
          data-testid="new-file-error"
          role="alert"
          style={{
            color: "#f44336",
            fontSize: "11px",
            marginTop: "3px",
            lineHeight: 1.3,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

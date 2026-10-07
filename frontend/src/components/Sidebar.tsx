import React, { useState } from "react";
import { FileList } from "./FileList.js";
import { NewFileInput } from "./NewFileInput.js";
import type { FileEntry } from "../collab/useIndex.js";

export interface SidebarProps {
  files: FileEntry[];
  activeFileId?: string;
  onFileClick?: (file: FileEntry) => void;
  /** Called with the trimmed name when the user confirms a new file name. */
  onCreateFile?: (name: string) => void;
  /** Called when a file is renamed. */
  onRenameFile?: (id: string, newName: string) => void;
  /** Called when a file is deleted. */
  onDeleteFile?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onFileClick,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
}) => {
  const [creatingFile, setCreatingFile] = useState(false);

  const handleConfirm = (name: string) => {
    setCreatingFile(false);
    onCreateFile?.(name);
  };

  const handleCancel = () => {
    setCreatingFile(false);
  };

  return (
    <aside
      data-testid="sidebar"
      aria-label="File explorer"
      style={{
        width: "200px",
        flexShrink: 0,
        backgroundColor: "#252526",
        borderRight: "1px solid #333333",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Section header + New file button */}
      <div
        style={{
          padding: "6px 8px 4px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#888888",
            userSelect: "none",
          }}
        >
          Files
        </span>
        <button
          data-testid="new-file-button"
          title="New file"
          aria-label="New file"
          onClick={() => setCreatingFile(true)}
          style={{
            background: "none",
            border: "none",
            color: "#888888",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
            padding: "0 2px",
            borderRadius: "3px",
          }}
          onMouseOver={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#cccccc")
          }
          onMouseOut={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#888888")
          }
        >
          +
        </button>
      </div>

      <FileList
        files={files}
        activeFileId={activeFileId}
        onFileClick={onFileClick}
        onRenameFile={onRenameFile}
        onDeleteFile={onDeleteFile}
      />

      {creatingFile && (
        <NewFileInput
          existingFiles={files}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </aside>
  );
};

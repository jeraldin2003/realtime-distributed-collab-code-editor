import React, { useState } from "react";
import { FileList } from "./FileList.js";
import { NewFileInput } from "./NewFileInput.js";
import type { FileEntry } from "../collab/useIndex.js";
import type { PresenceUser } from "../collab/usePresence.js";

export interface SidebarProps {
  files: FileEntry[];
  activeFileId?: string;
  fileUsers?: Record<string, PresenceUser[]>;
  localClientId?: number;
  onFileClick?: (file: FileEntry) => void;
  /** Called with the trimmed name when the user confirms a new file name. */
  onCreateFile?: (name: string, parentId?: string | null) => void;
  /** Called with the trimmed name when the user confirms a new folder name. */
  onCreateFolder?: (name: string, parentId?: string | null) => void;
  /** Called when a file is renamed. */
  onRenameFile?: (id: string, newName: string) => void;
  /** Called when a file is deleted. */
  onDeleteFile?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  fileUsers,
  localClientId,
  onFileClick,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
}) => {
  const [creating, setCreating] = useState<{
    type: "file" | "folder";
    parentId: string | null;
  } | null>(null);

  const handleConfirm = (name: string) => {
    if (!creating) return;
    if (creating.type === "file") {
      if (creating.parentId) {
        onCreateFile?.(name, creating.parentId);
      } else {
        onCreateFile?.(name);
      }
    } else {
      if (creating.parentId) {
        onCreateFolder?.(name, creating.parentId);
      } else {
        onCreateFolder?.(name);
      }
    }
    setCreating(null);
  };

  const handleCancel = () => {
    setCreating(null);
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
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            data-testid="new-file-button"
            title="New file"
            aria-label="New file"
            onClick={() => setCreating({ type: "file", parentId: null })}
            style={{
              background: "none",
              border: "none",
              color: "#888888",
              cursor: "pointer",
              fontSize: "15px",
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
            +📄
          </button>
          <button
            type="button"
            data-testid="new-folder-button"
            title="New folder"
            aria-label="New folder"
            onClick={() => setCreating({ type: "folder", parentId: null })}
            style={{
              background: "none",
              border: "none",
              color: "#888888",
              cursor: "pointer",
              fontSize: "15px",
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
            +📁
          </button>
        </div>
      </div>

      <FileList
        files={files}
        activeFileId={activeFileId}
        fileUsers={fileUsers}
        localClientId={localClientId}
        onFileClick={onFileClick}
        onRenameFile={onRenameFile}
        onDeleteFile={onDeleteFile}
        onCreateInFolder={(parentId, type) => setCreating({ type, parentId })}
      />

      {creating && (
        <NewFileInput
          existingFiles={files}
          parentId={creating.parentId}
          entryType={creating.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </aside>
  );
};

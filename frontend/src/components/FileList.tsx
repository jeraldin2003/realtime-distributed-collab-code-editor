import React from "react";
import type { FileEntry } from "../collab/useIndex.js";

export interface FileListProps {
  files: FileEntry[];
  /** The id of the currently active file. */
  activeFileId?: string;
  /** Called when the user clicks a file. */
  onFileClick?: (file: FileEntry) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  activeFileId,
  onFileClick,
}) => {
  if (files.length === 0) {
    return (
      <div
        style={{
          padding: "12px 16px",
          color: "#666666",
          fontSize: "12px",
          fontStyle: "italic",
        }}
      >
        No files
      </div>
    );
  }

  return (
    <ul
      data-testid="file-list"
      role="list"
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
      }}
    >
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        return (
          <li
            key={file.id}
            data-testid={`file-item-${file.id}`}
            role="listitem"
            onClick={() => onFileClick?.(file)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 16px",
              cursor: onFileClick ? "pointer" : "default",
              fontSize: "13px",
              fontFamily: "monospace",
              color: isActive ? "#ffffff" : "#cccccc",
              backgroundColor: isActive ? "#2d2d2d" : "transparent",
              borderLeft: isActive ? "2px solid #4fc3f7" : "2px solid transparent",
              userSelect: "none",
            }}
          >
            {/* File icon — simplified badge showing language hint */}
            <span
              aria-hidden="true"
              style={{ color: "#9cdcfe", fontSize: "11px", flexShrink: 0 }}
            >
              TS
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={file.name}
            >
              {file.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

import React from "react";
import { FileList } from "./FileList.js";
import type { FileEntry } from "../collab/useIndex.js";

export interface SidebarProps {
  files: FileEntry[];
  activeFileId?: string;
  onFileClick?: (file: FileEntry) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onFileClick,
}) => {
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
      {/* Section header */}
      <div
        style={{
          padding: "8px 16px 4px",
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#888888",
          userSelect: "none",
        }}
      >
        Files
      </div>

      <FileList files={files} activeFileId={activeFileId} onFileClick={onFileClick} />
    </aside>
  );
};

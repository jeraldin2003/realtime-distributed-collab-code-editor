import React, { useState, useRef, useEffect } from "react";
import type { FileEntry } from "../collab/useIndex.js";
import type { PresenceUser } from "../collab/usePresence.js";
import { validateFileName, VALIDATION_MESSAGES } from "../collab/fileIndex.js";

export interface FileListProps {
  files: FileEntry[];
  /** The id of the currently active file. */
  activeFileId?: string;
  /** Users present in each file doc. */
  fileUsers?: Record<string, PresenceUser[]>;
  /** Client ID of the local user to exclude from remote presence dots if needed. */
  localClientId?: number;
  /** Called when the user clicks a file. */
  onFileClick?: (file: FileEntry) => void;
  /** Called when an entry (file or folder) is renamed. */
  onRenameFile?: (id: string, newName: string) => void;
  /** Called when an entry (file or folder) is deleted. */
  onDeleteFile?: (id: string) => void;
  /** Called when user creates a file inside a folder. */
  onCreateInFolder?: (parentId: string, type: "file" | "folder") => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  activeFileId,
  fileUsers,
  localClientId,
  onFileClick,
  onRenameFile,
  onDeleteFile,
  onCreateInFolder,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Independent local expand/collapse state for folders
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());

  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

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

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const startRename = (file: FileEntry, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingId(null);
    setEditingId(file.id);
    setEditName(file.name);
    setEditError(null);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditName("");
    setEditError(null);
  };

  const confirmRename = (file: FileEntry) => {
    const trimmed = editName.trim();
    if (trimmed === file.name) {
      cancelRename();
      return;
    }
    const err = validateFileName(trimmed, files, file.id, file.parentId);
    if (err) {
      setEditError(VALIDATION_MESSAGES[err]);
      return;
    }
    onRenameFile?.(file.id, trimmed);
    cancelRename();
  };

  const startDelete = (file: FileEntry, e?: React.MouseEvent) => {
    e?.stopPropagation();
    cancelRename();
    setDeletingId(file.id);
  };

  const confirmDelete = (file: FileEntry, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingId(null);
    onDeleteFile?.(file.id);
  };

  const cancelDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingId(null);
  };

  // Build tree hierarchy: group files by parentId
  const childrenByParent = new Map<string | null, FileEntry[]>();
  for (const entry of files) {
    const pid = entry.parentId ?? null;
    const list = childrenByParent.get(pid) ?? [];
    list.push(entry);
    childrenByParent.set(pid, list);
  }

  // Sort each group: folders first, then files; alphabetically by name
  for (const list of childrenByParent.values()) {
    list.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      const nc = a.name.localeCompare(b.name);
      return nc !== 0 ? nc : a.id.localeCompare(b.id);
    });
  }

  // Recursive tree renderer
  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const items = childrenByParent.get(parentId) ?? [];
    if (items.length === 0) return null;

    return items.map((file) => {
      const isFolder = file.type === "folder";
      const isExpanded = expandedFolderIds.has(file.id);
      const isActive = file.id === activeFileId;
      const isEditing = file.id === editingId;
      const isDeleting = file.id === deletingId;
      const paddingLeft = `${16 + depth * 14}px`;

      if (isDeleting) {
        return (
          <li
            key={file.id}
            data-testid={`file-item-delete-confirm-${file.id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              padding: `6px 12px 6px ${paddingLeft}`,
              backgroundColor: "#3a1d1d",
              borderLeft: "2px solid #f44336",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#ffffff", wordBreak: "break-all" }}>
              Delete {isFolder ? "folder" : "file"} <strong>{file.name}</strong>
              {isFolder && " and all contents"}?
            </span>
            <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
              <button
                type="button"
                data-testid={`file-delete-confirm-btn-${file.id}`}
                onClick={(e) => confirmDelete(file, e)}
                style={{
                  backgroundColor: "#d32f2f",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "2px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                type="button"
                data-testid={`file-delete-cancel-btn-${file.id}`}
                onClick={(e) => cancelDelete(e)}
                style={{
                  backgroundColor: "#444444",
                  color: "#cccccc",
                  border: "none",
                  borderRadius: "2px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </li>
        );
      }

      if (isEditing) {
        return (
          <li
            key={file.id}
            data-testid={`file-item-editing-${file.id}`}
            style={{
              padding: `4px 8px 4px ${paddingLeft}`,
              backgroundColor: "#2d2d2d",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={editInputRef}
              data-testid={`file-rename-input-${file.id}`}
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                setEditError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmRename(file);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              onBlur={() => confirmRename(file)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "#3c3c3c",
                border: editError ? "1px solid #f44336" : "1px solid #555555",
                borderRadius: "3px",
                color: "#cccccc",
                fontSize: "12px",
                fontFamily: "monospace",
                padding: "3px 6px",
                outline: "none",
              }}
            />
            {editError && (
              <div
                data-testid={`file-rename-error-${file.id}`}
                role="alert"
                style={{
                  color: "#f44336",
                  fontSize: "11px",
                  marginTop: "3px",
                  lineHeight: 1.3,
                }}
              >
                {editError}
              </div>
            )}
          </li>
        );
      }

      return (
        <React.Fragment key={file.id}>
          <li
            data-testid={`file-item-${file.id}`}
            role="listitem"
            onClick={() => {
              if (isFolder) {
                toggleFolder(file.id);
              } else {
                onFileClick?.(file);
              }
            }}
            onDoubleClick={(e) => startRename(file, e)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `5px 8px 5px ${paddingLeft}`,
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "monospace",
              color: isActive ? "#ffffff" : "#cccccc",
              backgroundColor: isActive ? "#2d2d2d" : "transparent",
              borderLeft: isActive ? "2px solid #4fc3f7" : "2px solid transparent",
              userSelect: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              {/* Type icon / expander */}
              {isFolder ? (
                <span
                  data-testid={`folder-toggle-${file.id}`}
                  style={{
                    fontSize: "11px",
                    color: "#dcb67a",
                    userSelect: "none",
                    width: "14px",
                    display: "inline-block",
                    textAlign: "center",
                  }}
                >
                  {isExpanded ? "▾" : "▸"}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  style={{ color: "#9cdcfe", fontSize: "11px", flexShrink: 0 }}
                >
                  TS
                </span>
              )}
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: isFolder ? 600 : "normal",
                }}
                title={file.name}
              >
                {file.name}
              </span>

              {/* Other users presence dots for this file */}
              {!isFolder &&
                (() => {
                  const usersInFile = (fileUsers?.[file.id] ?? []).filter(
                    (u) => localClientId === undefined || u.clientId !== localClientId
                  );
                  if (usersInFile.length === 0) return null;

                  const displayUsers = usersInFile.slice(0, 3);
                  const overflowCount = usersInFile.length - displayUsers.length;
                  const tooltipText = usersInFile.map((u) => u.name).join(", ");

                  return (
                    <div
                      data-testid={`file-presence-${file.id}`}
                      title={tooltipText}
                      aria-label={`Users viewing ${file.name}: ${tooltipText}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        marginLeft: "4px",
                      }}
                    >
                      {displayUsers.map((u) => (
                        <span
                          key={u.clientId}
                          data-testid={`presence-dot-${file.id}-${u.clientId}`}
                          title={u.name}
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: u.color,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                      ))}
                      {overflowCount > 0 && (
                        <span
                          data-testid={`presence-overflow-${file.id}`}
                          style={{
                            fontSize: "10px",
                            color: "#aaaaaa",
                            marginLeft: "1px",
                            fontFamily: "sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          +{overflowCount}
                        </span>
                      )}
                    </div>
                  );
                })()}
            </div>

            {/* Action buttons (Add file/folder in folder, Rename & Delete) */}
            <div
              data-testid={`file-actions-${file.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                flexShrink: 0,
              }}
            >
              {isFolder && onCreateInFolder && (
                <>
                  <button
                    type="button"
                    data-testid={`folder-add-file-${file.id}`}
                    title="New file in folder"
                    aria-label={`New file in ${file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedFolderIds((prev) => new Set([...prev, file.id]));
                      onCreateInFolder(file.id, "file");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#888888",
                      cursor: "pointer",
                      fontSize: "11px",
                      padding: "1px 3px",
                      borderRadius: "2px",
                    }}
                  >
                    +📄
                  </button>
                  <button
                    type="button"
                    data-testid={`folder-add-folder-${file.id}`}
                    title="New subfolder"
                    aria-label={`New subfolder in ${file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedFolderIds((prev) => new Set([...prev, file.id]));
                      onCreateInFolder(file.id, "folder");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#888888",
                      cursor: "pointer",
                      fontSize: "11px",
                      padding: "1px 3px",
                      borderRadius: "2px",
                    }}
                  >
                    +📁
                  </button>
                </>
              )}
              <button
                type="button"
                data-testid={`file-rename-btn-${file.id}`}
                title="Rename"
                aria-label={`Rename ${file.name}`}
                onClick={(e) => startRename(file, e)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888888",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: "2px 4px",
                  borderRadius: "2px",
                }}
                onMouseOver={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#cccccc")
                }
                onMouseOut={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#888888")
                }
              >
                ✏️
              </button>
              <button
                type="button"
                data-testid={`file-delete-btn-${file.id}`}
                title="Delete"
                aria-label={`Delete ${file.name}`}
                onClick={(e) => startDelete(file, e)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888888",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: "2px 4px",
                  borderRadius: "2px",
                }}
                onMouseOver={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#ff6b6b")
                }
                onMouseOut={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#888888")
                }
              >
                🗑️
              </button>
            </div>
          </li>
          {isFolder && isExpanded && renderTree(file.id, depth + 1)}
        </React.Fragment>
      );
    });
  };

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
      {renderTree(null, 0)}
    </ul>
  );
};

import { useState, useEffect } from "react";
import { Header } from "./components/Header.js";
import { Editor } from "./components/Editor.js";
import { RoomFull } from "./components/RoomFull.js";
import { OfflineBanner } from "./components/OfflineBanner.js";
import { Sidebar } from "./components/Sidebar.js";
import { Notice } from "./components/Notice.js";
import { EmptyState } from "./components/EmptyState.js";
import { useIndex } from "./collab/useIndex.js";
import { useFileDoc } from "./collab/useFileDoc.js";
import { usePresence } from "./collab/usePresence.js";
import { useStatus } from "./collab/useStatus.js";
import { getOrCreateIdentity } from "./collab/identity.js";
import { getLanguageForFile } from "./languages.js";
import {
  createFile,
  renameFile,
  deleteFile,
  validateFileName,
} from "./collab/fileIndex.js";
import { resolveActiveFileOnFilesChange } from "./collab/fileResolution.js";
import type { FileEntry } from "./collab/useIndex.js";

export function App() {
  const [activeFileId, setActiveFileId] = useState<string | null>("main");
  const [notice, setNotice] = useState<string | null>(null);

  const index = useIndex();
  const identity = getOrCreateIdentity();
  const fileDoc = useFileDoc(
    activeFileId ?? "",
    index?.websocketProvider ?? null,
    identity
  );
  const presence = usePresence(index?.awareness ?? null);
  const statusData = useStatus();

  // Sync activeFileId to index awareness so peers know which file we are viewing
  useEffect(() => {
    if (!index?.awareness) return;
    index.awareness.setLocalStateField("activeFileId", activeFileId);
  }, [index?.awareness, activeFileId]);

  // Watch for changes to index.files and handle if active file was deleted
  useEffect(() => {
    if (!index) return;
    // When the index has files loaded:
    if (index.files.length > 0) {
      const { nextFileId, wasDeleted } = resolveActiveFileOnFilesChange(
        activeFileId,
        index.files
      );
      if (wasDeleted) {
        // Defer state update to next microtask/tick to prevent synchronous cascading render warning
        queueMicrotask(() => {
          setNotice("This file was deleted");
          setActiveFileId(nextFileId);
        });
      } else if (activeFileId === null) {
        queueMicrotask(() => {
          setActiveFileId(nextFileId);
        });
      }
    } else if (activeFileId !== null && index.status === "connected") {
      // If connected and index.files is truly empty, file was deleted or workspace is empty
      queueMicrotask(() => {
        setNotice("This file was deleted");
        setActiveFileId(null);
      });
    }
  }, [index, activeFileId]);

  const activeFile: FileEntry | undefined = index?.files.find(
    (f) => f.id === activeFileId
  );
  const activeFileName = activeFile?.name ?? (activeFileId ?? "");
  const language = getLanguageForFile(activeFileName);

  const handleFileClick = (file: FileEntry) => {
    setActiveFileId(file.id);
  };

  const handleCreateFile = (name: string) => {
    if (!index?.ydoc) return;
    // Validate before mutating
    const err = validateFileName(name, index.files);
    if (err) return;
    const newId = createFile(index.ydoc, { name });
    // Auto-select the new file for the creator
    setActiveFileId(newId);
  };

  const handleRenameFile = (id: string, newName: string) => {
    if (!index?.ydoc) return;
    const err = validateFileName(newName, index.files, id);
    if (err) return;
    renameFile(index.ydoc, id, newName);
  };

  const handleDeleteFile = (id: string) => {
    if (!index?.ydoc) return;
    deleteFile(index.ydoc, id);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        overflow: "hidden",
      }}
    >
      <Header
        fileName={activeFile ? activeFileName : "No file open"}
        status={index?.status}
        onlineCount={presence.onlineCount}
        maxUsers={statusData?.maxUsers}
        users={presence.users}
      />
      {notice && (
        <Notice message={notice} onDismiss={() => setNotice(null)} />
      )}
      <OfflineBanner
        visible={Boolean(
          index && index.status === "disconnected" && !index.isRoomFull
        )}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          height: "calc(100vh - 44px)",
        }}
      >
        {index && !index.isRoomFull && (
          <Sidebar
            files={index.files}
            activeFileId={activeFileId ?? undefined}
            fileUsers={presence.fileUsers}
            localClientId={index.awareness.clientID}
            onFileClick={handleFileClick}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        <main
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {index?.isRoomFull ? (
            <RoomFull onRetry={index.retry} />
          ) : !activeFileId || (index && index.files.length === 0) ? (
            <EmptyState
              onCreateFile={() => {
                // Trigger file creation default
                if (!index?.ydoc) return;
                const baseName = "untitled.ts";
                let name = baseName;
                let counter = 1;
                while (validateFileName(name, index.files)) {
                  name = `untitled-${counter}.ts`;
                  counter++;
                }
                handleCreateFile(name);
              }}
            />
          ) : (
            fileDoc && (
              <Editor
                ytext={fileDoc.ytext}
                awareness={fileDoc.awareness}
                language={language}
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

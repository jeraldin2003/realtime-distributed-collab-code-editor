import { useState } from "react";
import { Header } from "./components/Header.js";
import { Editor } from "./components/Editor.js";
import { RoomFull } from "./components/RoomFull.js";
import { OfflineBanner } from "./components/OfflineBanner.js";
import { Sidebar } from "./components/Sidebar.js";
import { useIndex } from "./collab/useIndex.js";
import { useFileDoc } from "./collab/useFileDoc.js";
import { usePresence } from "./collab/usePresence.js";
import { useStatus } from "./collab/useStatus.js";
import { getOrCreateIdentity } from "./collab/identity.js";
import { getLanguageForFile } from "./languages.js";
import { createFile, validateFileName } from "./collab/fileIndex.js";
import type { FileEntry } from "./collab/useIndex.js";

export function App() {
  const [activeFileId, setActiveFileId] = useState<string>("main");

  const index = useIndex();
  const identity = getOrCreateIdentity();
  const fileDoc = useFileDoc(
    activeFileId,
    index?.websocketProvider ?? null,
    identity
  );
  const presence = usePresence(index?.awareness ?? null);
  const statusData = useStatus();

  const activeFile: FileEntry | undefined = index?.files.find(
    (f) => f.id === activeFileId
  );
  const activeFileName = activeFile?.name ?? activeFileId;
  const language = getLanguageForFile(activeFileName);

  const handleFileClick = (file: FileEntry) => {
    setActiveFileId(file.id);
  };

  const handleCreateFile = (name: string) => {
    if (!index?.ydoc) return;
    // Validate before mutating (guard against race where files changed between
    // the user typing and confirming).
    const err = validateFileName(name, index.files);
    if (err) return; // NewFileInput already blocked invalid names; silent guard here
    const newId = createFile(index.ydoc, { name });
    // Auto-select the new file for the creator only.
    setActiveFileId(newId);
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
        fileName={activeFileName}
        status={index?.status}
        onlineCount={presence.onlineCount}
        maxUsers={statusData?.maxUsers}
        users={presence.users}
      />
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
            activeFileId={activeFileId}
            onFileClick={handleFileClick}
            onCreateFile={handleCreateFile}
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

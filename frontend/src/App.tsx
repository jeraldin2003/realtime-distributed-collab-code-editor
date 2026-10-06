import { Header } from "./components/Header.js";
import { Editor } from "./components/Editor.js";
import { RoomFull } from "./components/RoomFull.js";
import { OfflineBanner } from "./components/OfflineBanner.js";
import { Sidebar } from "./components/Sidebar.js";
import { useIndex } from "./collab/useIndex.js";
import { useCollab } from "./collab/useCollab.js";
import { usePresence } from "./collab/usePresence.js";
import { useStatus } from "./collab/useStatus.js";

// Active file is always "main" in P2-S2; switching is wired in P2-S3.
const ACTIVE_FILE_ID = "main";

export function App() {
  const index = useIndex();
  const collab = useCollab(index?.websocketProvider);
  // Presence is derived from the index provider's awareness (not the file provider's).
  const presence = usePresence(index?.awareness ?? null);
  const statusData = useStatus();

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
        {/* Left sidebar — file list */}
        {index && !index.isRoomFull && (
          <Sidebar files={index.files} activeFileId={ACTIVE_FILE_ID} />
        )}

        {/* Main content area */}
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
            collab && (
              <Editor ytext={collab.ytext} awareness={collab.awareness} />
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

import { Header } from "./components/Header.js";
import { Editor } from "./components/Editor.js";
import { RoomFull } from "./components/RoomFull.js";
import { useCollab } from "./collab/useCollab.js";
import { usePresence } from "./collab/usePresence.js";
import { useStatus } from "./collab/useStatus.js";

export function App() {
  const collab = useCollab();
  const presence = usePresence(collab?.awareness);
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
        status={collab?.status}
        onlineCount={presence.onlineCount}
        maxUsers={statusData?.maxUsers}
        users={presence.users}
      />
      <main
        style={{
          flex: 1,
          width: "100%",
          height: "calc(100vh - 44px)",
          position: "relative",
        }}
      >
        {collab?.isRoomFull ? (
          <RoomFull onRetry={collab.retry} />
        ) : (
          collab && (
            <Editor ytext={collab.ytext} awareness={collab.awareness} />
          )
        )}
      </main>
    </div>
  );
}

export default App;

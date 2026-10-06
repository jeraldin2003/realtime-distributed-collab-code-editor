import { Header } from "./components/Header.js";
import { Editor } from "./components/Editor.js";
import { useCollab } from "./collab/useCollab.js";
import { usePresence } from "./collab/usePresence.js";

export function App() {
  const collab = useCollab();
  const presence = usePresence(collab?.awareness);

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
        {/*
          Render the Editor only once the collab state is ready so that
          ytext and awareness are stable non-null values from the first mount.
          This also avoids flashing the editor before the provider exists.
        */}
        {collab && (
          <Editor ytext={collab.ytext} awareness={collab.awareness} />
        )}
      </main>
    </div>
  );
}

export default App;

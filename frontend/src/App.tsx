import { Header } from "./components/Header.js";
import { Editor } from "./components/Editor.js";

export function App() {
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
      <Header />
      <main
        style={{
          flex: 1,
          width: "100%",
          height: "calc(100vh - 44px)",
          position: "relative",
        }}
      >
        <Editor />
      </main>
    </div>
  );
}

export default App;

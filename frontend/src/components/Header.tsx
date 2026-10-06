import React from "react";
import { FILE_NAME } from "../config.js";

export interface HeaderProps {
  appName?: string;
  fileName?: string;
  statusText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  appName = "Collab Editor",
  fileName = FILE_NAME,
  statusText = "Local Mode",
}) => {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "44px",
        padding: "0 16px",
        backgroundColor: "#1e1e1e",
        color: "#cccccc",
        borderBottom: "1px solid #333333",
        fontSize: "14px",
        userSelect: "none",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ fontWeight: 600, color: "#ffffff" }}>{appName}</div>
      <div style={{ color: "#9cdcfe", fontFamily: "monospace", fontSize: "13px" }}>
        {fileName}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#888888",
          fontSize: "12px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#4caf50",
            display: "inline-block",
          }}
        />
        <span>{statusText}</span>
      </div>
    </header>
  );
};

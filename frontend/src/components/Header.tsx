import React from "react";
import { FILE_NAME } from "../config.js";

export interface HeaderProps {
  appName?: string;
  fileName?: string;
  /** Raw WebSocketStatus string from the provider (e.g. "connecting", "connected", "disconnected"). */
  status?: string;
  onlineCount?: number;
  maxUsers?: number;
  users?: Array<{ clientId: number; name: string; color: string }>;
}

export const Header: React.FC<HeaderProps> = ({
  appName = "Collab Editor",
  fileName = FILE_NAME,
  status = "connecting",
  onlineCount = 0,
  maxUsers,
  users = [],
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
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ fontWeight: 600, color: "#ffffff" }}>{appName}</div>
        <div style={{ color: "#9cdcfe", fontFamily: "monospace", fontSize: "13px" }}>
          {fileName}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Online users list */}
        {users.length > 0 && (
          <div
            data-testid="header-users-list"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {users.map((u) => (
              <span
                key={u.clientId}
                title={u.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: "#2d2d2d",
                  fontSize: "12px",
                  color: "#e0e0e0",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: u.color,
                    display: "inline-block",
                  }}
                />
                <span>{u.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Online count */}
        <div
          data-testid="header-online-count"
          style={{
            color: "#9cdcfe",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {maxUsers !== undefined ? `${onlineCount} / ${maxUsers} online` : `${onlineCount} online`}
        </div>

        {/* Connection status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#888888",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: status === "connected" ? "#4caf50" : "#ff9800",
              display: "inline-block",
            }}
          />
          <span>{status}</span>
        </div>
      </div>
    </header>
  );
};

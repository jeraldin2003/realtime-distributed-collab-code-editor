import React from "react";

export interface RoomFullProps {
  onRetry: () => void;
}

export const RoomFull: React.FC<RoomFullProps> = ({ onRetry }) => {
  return (
    <div
      data-testid="room-full-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "#1e1e1e",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textAlign: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#333333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          color: "#f44336",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        !
      </div>
      <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 600 }}>
        Room is full
      </h2>
      <p style={{ margin: "0 0 24px 0", color: "#888888", fontSize: "14px", maxWidth: "360px" }}>
        The maximum number of concurrent editors has been reached. Please wait for someone to leave or try again.
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: "8px 20px",
          backgroundColor: "#0e639c",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          outline: "none",
        }}
      >
        Try again
      </button>
    </div>
  );
};

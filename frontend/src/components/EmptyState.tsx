import React from "react";

export interface EmptyStateProps {
  onCreateFile: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateFile }) => {
  return (
    <div
      data-testid="empty-state"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "#888888",
        padding: "32px",
        textAlign: "center",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: "16px", marginBottom: "8px", color: "#cccccc" }}>
        No files open
      </div>
      <p style={{ fontSize: "13px", marginBottom: "16px", maxWidth: "300px" }}>
        There are no files in this workspace. Create a file to start editing.
      </p>
      <button
        data-testid="empty-state-create-button"
        onClick={onCreateFile}
        style={{
          backgroundColor: "#0e639c",
          color: "#ffffff",
          border: "none",
          borderRadius: "3px",
          padding: "6px 14px",
          fontSize: "13px",
          cursor: "pointer",
        }}
        onMouseOver={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1177bb")
        }
        onMouseOut={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0e639c")
        }
      >
        Create file
      </button>
    </div>
  );
};

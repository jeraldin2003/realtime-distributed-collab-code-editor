import React from "react";

export interface NoticeProps {
  message: string;
  onDismiss?: () => void;
}

export const Notice: React.FC<NoticeProps> = ({ message, onDismiss }) => {
  return (
    <div
      role="alert"
      data-testid="notice"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#d32f2f",
        color: "#ffffff",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        zIndex: 10,
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          data-testid="notice-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "2px 6px",
            lineHeight: 1,
            borderRadius: "3px",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

import React from "react";

export interface OfflineBannerProps {
  visible: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      data-testid="offline-banner"
      style={{
        width: "100%",
        backgroundColor: "#593a00",
        color: "#ffd580",
        padding: "6px 16px",
        fontSize: "12px",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxSizing: "border-box",
        borderBottom: "1px solid #734c00",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "#ffb74d",
          display: "inline-block",
        }}
      />
      <span>Offline. Your edits will sync when you reconnect.</span>
    </div>
  );
};

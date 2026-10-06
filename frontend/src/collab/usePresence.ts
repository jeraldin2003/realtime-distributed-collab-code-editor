import { useEffect, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import type { UserIdentity } from "./identity.js";

export interface PresenceUser extends UserIdentity {
  clientId: number;
}

export interface PresenceState {
  users: PresenceUser[];
  onlineCount: number;
}

const STYLE_ELEMENT_ID = "y-monaco-remote-cursor-styles";

/**
 * Injects or updates a <style> tag containing CSS for all remote cursors and selections.
 * Removes leftover rules when users depart.
 */
function updateRemoteCursorStyles(
  users: PresenceUser[],
  localClientId: number
) {
  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }

  // Base styles for remote selection head and selection caret
  const baseRules = `
    .yRemoteSelection {
      opacity: 0.35;
      position: absolute;
    }
    .yRemoteSelectionHead {
      position: absolute;
      box-sizing: border-box;
      height: 100%;
      border-left: 2px solid;
    }
    .yRemoteSelectionHead::after {
      position: absolute;
      top: -1.2em;
      left: -2px;
      font-size: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 600;
      line-height: 1.2;
      padding: 1px 4px;
      border-radius: 3px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 1000;
      color: #ffffff;
    }
  `;

  // Filter out local user so we only style remote cursors
  const remoteUsers = users.filter((u) => u.clientId !== localClientId);

  const clientRules = remoteUsers
    .map((user) => {
      const escapedName = JSON.stringify(user.name);
      return `
        .yRemoteSelection-${user.clientId} {
          background-color: ${user.color};
        }
        .yRemoteSelectionHead-${user.clientId} {
          border-left-color: ${user.color};
        }
        .yRemoteSelectionHead-${user.clientId}::after {
          content: ${escapedName};
          background-color: ${user.color};
        }
      `;
    })
    .join("\n");

  styleEl.textContent = `${baseRules}\n${clientRules}`;
}

export function usePresence(awareness: Awareness | null | undefined): PresenceState {
  const [presence, setPresence] = useState<PresenceState>({
    users: [],
    onlineCount: 0,
  });

  useEffect(() => {
    if (!awareness) return;

    const parsePresenceUsers = (): PresenceUser[] => {
      const states = awareness.getStates();
      const list: PresenceUser[] = [];

      states.forEach((state, clientId) => {
        if (state && state.user && typeof state.user.name === "string" && typeof state.user.color === "string") {
          list.push({
            clientId,
            name: state.user.name,
            color: state.user.color,
          });
        }
      });

      return list;
    };

    const handleAwarenessChange = () => {
      const users = parsePresenceUsers();
      updateRemoteCursorStyles(users, awareness.clientID);
      setPresence({
        users,
        onlineCount: users.length,
      });
    };

    // Initial population
    handleAwarenessChange();

    awareness.on("change", handleAwarenessChange);

    return () => {
      awareness.off("change", handleAwarenessChange);
      // Remove or reset the styles on unmount
      const styleEl = document.getElementById(STYLE_ELEMENT_ID);
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [awareness]);

  return presence;
}

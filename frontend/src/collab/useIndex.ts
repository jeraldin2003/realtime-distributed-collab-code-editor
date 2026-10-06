/**
 * useIndex.ts — manages the project:index provider.
 *
 * Responsibilities:
 * - Creates one HocuspocusProviderWebsocket shared with the file provider.
 * - Creates one HocuspocusProvider for INDEX_DOC (project:index).
 * - Exposes reactive sorted FileEntry list from the Y.Map "files".
 * - Owns the user cap: room-full and retry logic live here.
 * - Exposes awareness and status for the Header.
 * - Exposes the shared websocketProvider so useCollab can multiplex on it.
 *
 * One browser tab = one WebSocket = one index connection = one counted user.
 */

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
  WebSocketStatus,
} from "@hocuspocus/provider";
import { Awareness } from "y-protocols/awareness";
import { INDEX_DOC, WS_URL } from "../config.js";
import { getOrCreateIdentity } from "./identity.js";

export interface FileEntry {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
}

export interface IndexState {
  /** Sorted list of files from the index doc. */
  files: FileEntry[];
  /** WebSocket connection status (from the shared socket). */
  status: WebSocketStatus;
  /** True when the server rejected the connection because the room is full. */
  isRoomFull: boolean;
  /** Call to attempt reconnecting after a room-full rejection. */
  retry: () => void;
  /** Awareness for presence (user list, count). */
  awareness: Awareness;
  /** The shared websocket — pass to useCollab so only one socket is opened. */
  websocketProvider: HocuspocusProviderWebsocket;
}

function readFiles(filesMap: Y.Map<Y.Map<unknown>>): FileEntry[] {
  const result: FileEntry[] = [];
  for (const [id, entry] of filesMap.entries()) {
    result.push({
      id,
      name: String(entry.get("name") ?? ""),
      type: (entry.get("type") as "file" | "folder") ?? "file",
      parentId: (entry.get("parentId") as string | null) ?? null,
    });
  }
  // Sort by name then id — consistent with backend/src/fileIndex.ts
  result.sort((a, b) => {
    const nc = a.name.localeCompare(b.name);
    return nc !== 0 ? nc : a.id.localeCompare(b.id);
  });
  return result;
}

export function useIndex(): IndexState | null {
  const [state, setState] = useState<IndexState | null>(null);
  const stateRef = useRef<IndexState | null>(null);
  const isRoomFullRef = useRef(false);

  useEffect(() => {
    let active = true;

    // One shared WebSocket for both index and file providers.
    const wsProvider = new HocuspocusProviderWebsocket({ url: WS_URL });

    const ydoc = new Y.Doc();
    const filesMap = ydoc.getMap<Y.Map<unknown>>("files");

    // providerRef avoids TDZ in callbacks called during construction.
    const providerRef: { current: HocuspocusProvider | null } = { current: null };

    const retry = () => {
      isRoomFullRef.current = false;
      wsProvider.connect();
      if (stateRef.current) {
        const next: IndexState = {
          ...stateRef.current,
          isRoomFull: false,
          status: WebSocketStatus.Connecting,
        };
        stateRef.current = next;
        setState(next);
      }
    };

    const provider = new HocuspocusProvider({
      websocketProvider: wsProvider,
      name: INDEX_DOC,
      document: ydoc,
      onStatus({ status }: { status: WebSocketStatus }) {
        if (!active) return;
        const aw = providerRef.current?.awareness as Awareness | undefined;
        if (!aw) return;
        const next: IndexState = {
          files: readFiles(filesMap),
          status,
          isRoomFull: isRoomFullRef.current,
          retry,
          awareness: aw,
          websocketProvider: wsProvider,
        };
        stateRef.current = next;
        setState(next);
      },
      onAuthenticationFailed() {
        if (!active) return;
        isRoomFullRef.current = true;
        wsProvider.disconnect();
        if (stateRef.current) {
          const next: IndexState = {
            ...stateRef.current,
            isRoomFull: true,
            status: WebSocketStatus.Disconnected,
          };
          stateRef.current = next;
          setState(next);
        }
      },
    });

    providerRef.current = provider;
    // When websocketProvider is supplied externally, manageSocket=false and
    // attach() is never called automatically. Call it manually so the provider
    // registers its event listeners on the shared socket (status, connect, etc.).
    provider.attach();
    const awareness = provider.awareness as Awareness;

    // Set local identity in awareness
    const identity = getOrCreateIdentity();
    awareness.setLocalStateField("user", identity);

    // Observe the files map for reactive updates
    const handleFilesChange = () => {
      if (!active) return;
      if (!stateRef.current) return;
      const next: IndexState = {
        ...stateRef.current,
        files: readFiles(filesMap),
      };
      stateRef.current = next;
      setState(next);
    };
    filesMap.observe(handleFilesChange);

    // Set initial state synchronously so App can render immediately.
    const initial: IndexState = {
      files: readFiles(filesMap),
      status: WebSocketStatus.Connecting,
      isRoomFull: false,
      retry,
      awareness,
      websocketProvider: wsProvider,
    };
    stateRef.current = initial;
    setState(initial);

    return () => {
      active = false;
      providerRef.current = null;
      filesMap.unobserve(handleFilesChange);
      provider.detach();
      provider.destroy();
      ydoc.destroy();
      wsProvider.destroy();
      stateRef.current = null;
      setState(null);
    };
  }, []); // create once per mount lifecycle

  return state;
}

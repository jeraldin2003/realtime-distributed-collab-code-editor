/**
 * useCollab — creates one Y.Doc and one HocuspocusProvider for DOC_NAME,
 * exposes { ytext, awareness, status }, and destroys everything on unmount.
 *
 * StrictMode safety: React StrictMode runs each effect twice (mount → unmount
 * → mount). The empty-dep useEffect is the correct guard: React's cleanup
 * destroys the first pair; the second mount creates a fresh pair.
 */
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import {
  HocuspocusProvider,
  WebSocketStatus,
} from "@hocuspocus/provider";
import { Awareness } from "y-protocols/awareness";
import { DOC_NAME, WS_URL } from "../config.js";
import { getOrCreateIdentity } from "./identity.js";

export interface CollabState {
  ytext: Y.Text;
  awareness: Awareness;
  status: WebSocketStatus;
  isRoomFull: boolean;
  retry: () => void;
}

export function useCollab(): CollabState | null {
  const [state, setState] = useState<CollabState | null>(null);
  const stateRef = useRef<CollabState | null>(null);
  const isRoomFullRef = useRef(false);

  useEffect(() => {
    let active = true;
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("content");

    // providerRef lets the onStatus callback refer to the provider even when
    // onStatus is called synchronously from the constructor (where `provider`
    // itself would be in the TDZ if declared with `const`).
    const providerRef: { current: HocuspocusProvider | null } = { current: null };

    const retry = () => {
      isRoomFullRef.current = false;
      if (providerRef.current) {
        // Disconnect and reconnect to attempt a new slot
        providerRef.current.configuration.websocketProvider.disconnect();
        providerRef.current.configuration.websocketProvider.connect();
      }
      if (stateRef.current) {
        const next: CollabState = {
          ...stateRef.current,
          isRoomFull: false,
          status: WebSocketStatus.Connecting,
        };
        stateRef.current = next;
        setState(next);
      }
    };

    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: DOC_NAME,
      document: ydoc,
      onStatus({ status }: { status: WebSocketStatus }) {
        if (!active) return;
        const aw =
          stateRef.current?.awareness ??
          (providerRef.current?.awareness as Awareness | undefined) ??
          null;
        if (!aw) return;
        const next: CollabState = {
          ytext,
          awareness: aw,
          status,
          isRoomFull: isRoomFullRef.current,
          retry,
        };
        stateRef.current = next;
        setState(next);
      },
      onAuthenticationFailed() {
        if (!active) return;
        isRoomFullRef.current = true;
        // Stop provider from retrying aggressively while room is full
        providerRef.current?.configuration.websocketProvider.disconnect();
        if (stateRef.current) {
          const next: CollabState = {
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
    // awareness is always created by Hocuspocus during construction.
    const awareness = provider.awareness as Awareness;

    // Set local identity in awareness
    const identity = getOrCreateIdentity();
    awareness.setLocalStateField("user", identity);

    // Set the initial state synchronously so the Editor renders immediately.
    const initial: CollabState = {
      ytext,
      awareness,
      status: WebSocketStatus.Connecting,
      isRoomFull: false,
      retry,
    };
    stateRef.current = initial;
    setState(initial);

    return () => {
      active = false;
      providerRef.current = null;
      // Destroy provider first (closes socket/timers), then the doc.
      provider.destroy();
      ydoc.destroy();
      stateRef.current = null;
      setState(null);
    };
  }, []); // empty deps — create once per mount lifecycle

  return state;
}

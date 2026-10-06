/**
 * useCollab.ts — creates one Y.Doc and one HocuspocusProvider for DOC_NAME
 * (the active file doc), multiplexed over the shared WebSocket from useIndex.
 *
 * Changes from P1:
 * - Accepts a shared HocuspocusProviderWebsocket from useIndex. When it is not
 *   yet available (index still initialising) the hook returns null.
 * - Room-full / cap logic has moved entirely to useIndex.
 * - The file provider does NOT manage the socket (manageSocket=false); it is
 *   destroyed but the socket itself is owned and destroyed by useIndex.
 *
 * StrictMode safety: React StrictMode runs each effect twice. The deps array
 * [websocketProvider] ensures we re-create exactly when the shared socket
 * instance changes (i.e. when useIndex remounts).
 */
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
  WebSocketStatus,
} from "@hocuspocus/provider";
import { Awareness } from "y-protocols/awareness";
import { DOC_NAME } from "../config.js";

export interface CollabState {
  ytext: Y.Text;
  awareness: Awareness;
  status: WebSocketStatus;
}

export function useCollab(
  websocketProvider: HocuspocusProviderWebsocket | null | undefined
): CollabState | null {
  const [state, setState] = useState<CollabState | null>(null);
  const stateRef = useRef<CollabState | null>(null);

  useEffect(() => {
    if (!websocketProvider) return;

    let active = true;
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("content");

    const providerRef: { current: HocuspocusProvider | null } = { current: null };

    const provider = new HocuspocusProvider({
      websocketProvider,
      name: DOC_NAME,
      document: ydoc,
      onStatus({ status }: { status: WebSocketStatus }) {
        if (!active) return;
        const aw = providerRef.current?.awareness as Awareness | undefined;
        if (!aw) return;
        const next: CollabState = { ytext, awareness: aw, status };
        stateRef.current = next;
        setState(next);
      },
    });

    providerRef.current = provider;
    const awareness = provider.awareness as Awareness;

    // Set the initial state synchronously so the Editor renders immediately.
    const initial: CollabState = {
      ytext,
      awareness,
      status: WebSocketStatus.Connecting,
    };
    stateRef.current = initial;
    setState(initial);

    return () => {
      active = false;
      providerRef.current = null;
      // Destroy provider (detaches from shared socket) but NOT the socket itself.
      provider.destroy();
      ydoc.destroy();
      stateRef.current = null;
      setState(null);
    };
  }, [websocketProvider]); // re-create if the shared socket instance changes

  return state;
}

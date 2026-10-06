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

export interface CollabState {
  ytext: Y.Text;
  awareness: Awareness;
  status: WebSocketStatus;
}

export function useCollab(): CollabState | null {
  const [state, setState] = useState<CollabState | null>(null);
  const stateRef = useRef<CollabState | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("content");

    // providerRef lets the onStatus callback refer to the provider even when
    // onStatus is called synchronously from the constructor (where `provider`
    // itself would be in the TDZ if declared with `const`).
    const providerRef: { current: HocuspocusProvider | null } = { current: null };

    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: DOC_NAME,
      document: ydoc,
      onStatus({ status }: { status: WebSocketStatus }) {
        // providerRef.current may still be null if this fires synchronously
        // during the constructor. In that case awareness will be set
        // immediately after construction and the initial setState below covers
        // the initial status; subsequent calls will have providerRef populated.
        const aw =
          stateRef.current?.awareness ??
          (providerRef.current?.awareness as Awareness | undefined) ??
          null;
        if (!aw) return; // awareness not ready yet; initial setState covers this
        const next: CollabState = { ytext, awareness: aw, status };
        stateRef.current = next;
        setState(next);
      },
    });

    providerRef.current = provider;
    // awareness is always created by Hocuspocus during construction.
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

/**
 * useFileDoc.ts — provider for the currently active file doc.
 *
 * Creates one HocuspocusProvider for "file:<fileId>" on the shared socket.
 * Destroys and recreates when fileId changes (so only the active file has
 * a live provider — see file-model SKILL).
 *
 * Identity is set on the file provider's awareness so remote cursors work
 * inside the open file.
 */

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
  WebSocketStatus,
} from "@hocuspocus/provider";
import { Awareness } from "y-protocols/awareness";
import type { UserIdentity } from "./identity.js";

export interface FileDocState {
  /** The Y.Text "content" of the active file doc. */
  ytext: Y.Text;
  /** Awareness for the file provider (remote cursors). */
  awareness: Awareness;
  /** Connection status for the file provider. */
  status: WebSocketStatus;
  /** The fileId this state belongs to — lets Editor detect when the file changed. */
  fileId: string;
}

export function useFileDoc(
  fileId: string | null,
  websocketProvider: HocuspocusProviderWebsocket | null | undefined,
  identity: UserIdentity | null
): FileDocState | null {
  const [state, setState] = useState<FileDocState | null>(null);
  const stateRef = useRef<FileDocState | null>(null);

  useEffect(() => {
    // Wait until both fileId and websocketProvider are available.
    if (!fileId || !websocketProvider) {
      return;
    }

    let active = true;
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("content");
    const docName = `file:${fileId}`;

    // providerRef avoids TDZ when onStatus fires synchronously during construction.
    const providerRef: { current: HocuspocusProvider | null } = { current: null };

    const provider = new HocuspocusProvider({
      websocketProvider,
      name: docName,
      document: ydoc,
      onStatus({ status }: { status: WebSocketStatus }) {
        if (!active) return;
        const aw = providerRef.current?.awareness as Awareness | undefined;
        if (!aw) return;
        const next: FileDocState = { ytext, awareness: aw, status, fileId };
        stateRef.current = next;
        setState(next);
      },
    });

    providerRef.current = provider;
    // Must call attach() manually when websocketProvider is supplied externally
    // (manageSocket=false so the library skips it). Verified from source line 721.
    provider.attach();
    const awareness = provider.awareness as Awareness;

    // Set local identity so remote cursors show this user's name/colour.
    if (identity) {
      awareness.setLocalStateField("user", identity);
    }

    // Publish initial state synchronously so the Editor can render immediately.
    const initial: FileDocState = {
      ytext,
      awareness,
      status: WebSocketStatus.Connecting,
      fileId,
    };
    stateRef.current = initial;
    setState(initial);

    return () => {
      active = false;
      providerRef.current = null;
      provider.detach();
      provider.destroy();
      ydoc.destroy();
      stateRef.current = null;
      setState(null);
    };
  // identity is sessionStorage-stable within a tab (same object every call);
  // listing it would cause an infinite loop since App calls getOrCreateIdentity()
  // on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, websocketProvider]);

  return state;
}

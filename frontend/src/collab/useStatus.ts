import { useEffect, useState } from "react";
import { HTTP_URL } from "../config.js";

export interface StatusData {
  users: number;
  maxUsers: number;
}

export function useStatus(): StatusData | null {
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      try {
        const res = await fetch(`${HTTP_URL}/status`);
        if (res.ok) {
          const data = (await res.json()) as StatusData;
          if (active) {
            setStatus(data);
          }
        }
      } catch {
        // Ignore network errors; fallback gracefully
      }
    }

    fetchStatus();
    // Refresh periodically (every 5 seconds) to keep maxUsers in sync
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}

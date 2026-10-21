
import { useEffect } from "react";

export default function usePolling(callback, delay = 5000) {
  useEffect(() => {
    let timeoutId;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      try {
        if (document.visibilityState === "visible") {
          await callback();
        }
      } catch (error) {
        console.error("Polling failed:", error);
      }

      if (!cancelled) {
        timeoutId = setTimeout(poll, delay);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [callback, delay]);
}

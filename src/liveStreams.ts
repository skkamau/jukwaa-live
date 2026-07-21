import { useCallback, useEffect, useState } from "react";
import { streamsApi, type PublicStream } from "./api/streams";

// Keep labelled fictional streams visible during public prelaunch so discovery
// remains useful while real creators are still testing the platform.
export const demoContentEnabled = true;

export function useLiveStreams() {
  const [streams, setStreams] = useState<PublicStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStreams((await streamsApi.live()).streams);
      setUnavailable(false);
    } catch {
      setStreams([]);
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void refresh(), [refresh]);
  return { streams, loading, unavailable, refresh };
}

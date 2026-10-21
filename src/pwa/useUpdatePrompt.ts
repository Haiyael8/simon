import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

// Registers the service worker and exposes a manual refresh (ADR-6)
export function useUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const update = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    update.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedRefresh(true),
    });
  }, []);

  const refresh = useCallback(() => {
    void update.current?.(true);
  }, []);

  return { needRefresh, refresh };
}

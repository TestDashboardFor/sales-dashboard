type Listener = (waking: boolean) => void;

const listeners = new Set<Listener>();
let pending: Promise<void> | null = null;

export function onWaking(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const notify = (waking: boolean) => listeners.forEach((fn) => fn(waking));

// Render wakes a sleeping free service only for requests from outside its
// network; the same request sent by the frontend proxy gets a 502 and the API
// stays asleep. So the browser pings the API directly.
export function wakeApi(): Promise<void> {
  pending ??= (async () => {
    notify(true);
    try {
      const res = await fetch("/config", { cache: "no-store" });
      const { apiUrl } = (await res.json()) as { apiUrl: string };
      if (apiUrl) {
        await fetch(`${apiUrl}/health`, {
          mode: "no-cors",
          cache: "no-store",
          signal: AbortSignal.timeout(120_000),
        });
      }
    } catch {
      // The caller retries its request either way.
    } finally {
      pending = null;
      notify(false);
    }
  })();
  return pending;
}

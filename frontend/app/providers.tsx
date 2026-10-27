"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import WakeBanner from "@/components/WakeBanner";
import { api, ApiError } from "@/lib/api";

// Clearing the cookie first avoids a /login <-> /dashboard redirect loop with a stale token.
function handleUnauthorized(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    api.logout().finally(() => {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    });
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleUnauthorized }),
        defaultOptions: { queries: { staleTime: 30_000, retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <WakeBanner />
    </QueryClientProvider>
  );
}

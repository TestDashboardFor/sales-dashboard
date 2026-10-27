"use client";

import { useEffect, useState } from "react";
import { onWaking } from "@/lib/wake";

export default function WakeBanner() {
  const [waking, setWaking] = useState(false);
  useEffect(() => onWaking(setWaking), []);

  if (!waking) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-3 z-50 mx-auto w-fit max-w-[calc(100vw-2rem)] rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow-lg"
    >
      The server was asleep and is waking up. This can take up to a minute.
    </div>
  );
}

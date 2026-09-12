"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Previously signed users out after 30 minutes of no interaction while the
 * tab was open. Product decision (2026-09): keep sessions open — this guard
 * is disabled (not mounted from layout). Re-enable only if security policy
 * requires client-side idle logout.
 *
 * Separate from Clerk Dashboard → Sessions → inactivity / session lifetime.
 */
export const IDLE_TIMEOUT_MINUTES = 30;

const IDLE_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
];

/** @deprecated Not mounted — kept for optional re-enable. */
export function IdleSessionGuard() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function scheduleLogout() {
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (signingOutRef.current) return;
        signingOutRef.current = true;
        void signOut({
          redirectUrl: `/login?idle=1`,
        });
      }, IDLE_MS);
    }

    function onActivity() {
      if (document.visibilityState === "hidden") return;
      scheduleLogout();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        scheduleLogout();
      }
    }

    scheduleLogout();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isLoaded, isSignedIn, signOut]);

  return null;
}

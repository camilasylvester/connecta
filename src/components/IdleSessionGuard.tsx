"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/** Minutes without interaction before auto sign-out. */
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

/**
 * Signs the user out after IDLE_TIMEOUT_MINUTES without interaction
 * (while the tab is open). Clerk Dashboard "Inactivity timeout" covers
 * closed/background tabs separately.
 */
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

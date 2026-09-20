"use client";

import type { ReactNode } from "react";

/** Segmented progress bar (Higgsfield-style), Connecta purple. */
export function AuthProgress({
  total,
  current,
  labels,
}: {
  total: number;
  current: number;
  labels?: string[];
}) {
  return (
    <div className="auth-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
      <div className="auth-progress-bars">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const state = n < current ? "done" : n === current ? "active" : "";
          return (
            <span
              key={n}
              className={`auth-progress-seg ${state}`}
              title={labels?.[i]}
            />
          );
        })}
      </div>
      {labels?.[current - 1] ? (
        <p className="auth-progress-label">{labels[current - 1]}</p>
      ) : null}
    </div>
  );
}

export function IconUser({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 19.25c1.6-3.2 4-4.75 6.5-4.75s4.9 1.55 6.5 4.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBrand({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 14.5V9.5h3.2a2.5 2.5 0 0 1 0 5H8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLogin({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 7V5.5A2.5 2.5 0 0 1 12.5 3h6A2.5 2.5 0 0 1 21 5.5v13A2.5 2.5 0 0 1 18.5 21h-6A2.5 2.5 0 0 1 10 18.5V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M3.5 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 8.5 14.5 12 11 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSignup({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.75 19.25c1.4-2.9 3.5-4.35 6.25-4.35 1.1 0 2.1.23 3 .66"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M17.5 14v7M14 17.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AuthSelectCard({
  selected,
  onClick,
  title,
  description,
  icon,
}: {
  selected?: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`auth-select-card${selected ? " is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="auth-select-card-top">
        <span className="auth-select-card-icon">{icon}</span>
        <span className="auth-select-card-radio" aria-hidden />
      </span>
      <strong className="auth-select-card-title">{title}</strong>
      <span className="auth-select-card-desc">{description}</span>
    </button>
  );
}

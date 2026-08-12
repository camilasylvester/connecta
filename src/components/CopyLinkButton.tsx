"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <input
        readOnly
        value={url}
        className="config-input"
        style={{ flex: 1, minWidth: 180 }}
      />
      <button type="button" onClick={copy} className="btn btn-solid btn-sm">
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}

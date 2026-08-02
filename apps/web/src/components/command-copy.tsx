"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CommandCopy({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const command = "npx lovtokens@latest connect";
  return (
    <button className={compact ? "command command-compact" : "command"} onClick={async () => {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }} type="button">
      <span className="prompt">$</span><code>{command}</code>{copied ? <Check size={17} /> : <Copy size={17} />}
    </button>
  );
}

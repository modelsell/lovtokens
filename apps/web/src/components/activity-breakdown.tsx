import { formatTokenCount } from "@/lib/format";

export function ActivityBreakdown({ rows }: { rows: Array<{ label: string; tokens: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.tokens));
  if (!rows.length) return <p className="form-message">—</p>;

  return <div className="dashboard-breakdown">{rows.map((row) => <div key={row.label}>
    <span><strong title={row.label}>{row.label}</strong><small>{formatTokenCount(row.tokens)}</small></span>
    <i><b style={{ width: `${(row.tokens / max) * 100}%` }} /></i>
  </div>)}</div>;
}

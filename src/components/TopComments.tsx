"use client";
import { AnalyticsResult } from "@/types";
import { getCurrentWeek, getLastWeek } from "@/lib/analytics";

interface Props {
  analytics: AnalyticsResult;
  keywordOnly?: boolean;
  limit?: number;
}

export default function TopComments({ analytics, keywordOnly, limit = 10 }: Props) {
  const cw = getCurrentWeek();
  const lw = getLastWeek();

  let filtered = analytics.processed.filter((c) => c.week === cw);
  if (keywordOnly) filtered = filtered.filter((c) => c.keyword);

  const sorted = [...filtered].sort((a, b) => b.ups - a.ups).slice(0, limit);
  if (sorted.length === 0) return null;

  function dateColor(date: string): string {
    try {
      const [y, m, d] = date.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      const sun = new Date(dt);
      sun.setUTCDate(dt.getUTCDate() - dt.getUTCDay());
      const w = sun.toISOString().slice(0, 10);
      if (w === cw) return "var(--neon-green)";
      if (w === lw) return "var(--neon-amber)";
    } catch {}
    return "var(--text-primary)";
  }

  const title = keywordOnly ? "TOP_KEYWORD_COMMENTS // THIS_WEEK" : "TOP_COMMENTS // THIS_WEEK";

  return (
    <div className="panel fade-up">
      <div className="panel-title">{title}</div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th style={{ textAlign: "right" }}>LIKES</th>
              <th style={{ textAlign: "center" }}>KW</th>
              <th>SUBREDDIT</th>
              <th>DATE</th>
              <th>PREVIEW</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={`${c.date}-${c.link}-${i}`}>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{String(i + 1).padStart(2, "0")}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--neon-green)", fontWeight: 700 }}>{c.ups}</td>
                <td style={{ textAlign: "center" }}>
                  {c.keyword
                    ? <span style={{ color: "var(--neon-green)", fontFamily: "'Share Tech Mono'" }}>Y</span>
                    : <span style={{ color: "var(--text-dim)", fontFamily: "'Share Tech Mono'" }}>N</span>}
                </td>
                <td className="mono">
                  <span style={{ color: "var(--neon-teal)" }}>r/</span>
                  <span style={{ color: "var(--text-secondary)" }}>{c.subreddit}</span>
                </td>
                <td className="mono" style={{ color: dateColor(c.date) }}>{c.date}</td>
                <td style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono"
                    style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: "0.68rem" }}
                    title={c.body}
                  >
                    {c.body.length > 80 ? c.body.slice(0, 80) + "..." : c.body}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

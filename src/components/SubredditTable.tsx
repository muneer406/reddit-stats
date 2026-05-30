"use client";
import { AnalyticsResult } from "@/types";

interface Props { analytics: AnalyticsResult; }

export default function SubredditTable({ analytics }: Props) {
  const entries = Object.entries(analytics.subreddit_counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (entries.length === 0) return null;

  const max = entries[0][1];

  return (
    <div className="panel fade-up">
      <div className="panel-title">SUBREDDIT_BREAKDOWN</div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>SUBREDDIT</th>
              <th style={{ textAlign: "right" }}>COUNT</th>
              <th style={{ textAlign: "right" }}>SHARE</th>
              <th style={{ width: 80 }}>BAR</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([sub, count], i) => {
              const pct = ((count / analytics.total_comments) * 100).toFixed(1);
              const barPct = (count / max) * 100;
              return (
                <tr key={sub}>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{String(i + 1).padStart(2, "0")}</td>
                  <td className="mono">
                    <span style={{ color: "var(--neon-teal)" }}>r/</span>
                    <span style={{ color: "var(--text-primary)" }}>{sub}</span>
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--neon-green)" }}>{count}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--text-secondary)" }}>{pct}%</td>
                  <td>
                    <div style={{ height: 4, background: "var(--bg-void)", border: "1px solid var(--border)" }}>
                      <div style={{ width: `${barPct}%`, height: "100%", background: "var(--neon-teal)", opacity: 0.7 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

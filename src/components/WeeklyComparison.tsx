"use client";
import { AnalyticsResult } from "@/types";
import { getCurrentWeek, getLastWeek, formatWeekDisplay } from "@/lib/analytics";

interface Props { analytics: AnalyticsResult; }

export default function WeeklyComparison({ analytics }: Props) {
  const cw = getCurrentWeek();
  const lw = getLastWeek();
  const cwData = analytics.weekly_data[cw];
  const lwData = analytics.weekly_data[lw];

  const metrics = [
    { label: "COMMENTS", cur: cwData?.comments || 0, prev: lwData?.comments || 0 },
    { label: "KEYWORD_HITS", cur: cwData?.keyword || 0, prev: lwData?.keyword || 0 },
    { label: "TOTAL_LIKES", cur: cwData?.likes || 0, prev: lwData?.likes || 0 },
    { label: "KW_LIKES", cur: cwData?.keyword_likes || 0, prev: lwData?.keyword_likes || 0 },
  ];

  return (
    <div className="panel fade-up">
      <div className="panel-title">WEEKLY_COMPARISON</div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>METRIC</th>
              <th style={{ textAlign: "right", color: "var(--neon-green)" }}>{formatWeekDisplay(cw)} [CUR]</th>
              <th style={{ textAlign: "right", color: "var(--neon-amber)" }}>{formatWeekDisplay(lw)} [PRV]</th>
              <th style={{ textAlign: "right" }}>DELTA</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ label, cur, prev }) => {
              const diff = cur - prev;
              const diffColor = diff > 0 ? "var(--neon-green)" : diff < 0 ? "var(--neon-red)" : "var(--text-secondary)";
              const diffStr = diff > 0 ? `+${diff}` : String(diff);
              return (
                <tr key={label}>
                  <td className="mono" style={{ color: "var(--text-secondary)" }}>{label}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--neon-green)" }}>{cur.toLocaleString()}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--neon-amber)" }}>{prev.toLocaleString()}</td>
                  <td className="mono" style={{ textAlign: "right", color: diffColor, fontWeight: 700 }}>{diffStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";
import { AnalyticsResult } from "@/types";
import { getCurrentWeek, getLastWeek, formatWeekDisplay } from "@/lib/analytics";

interface Props { analytics: AnalyticsResult; }

export default function WeeklyTable({ analytics }: Props) {
  const cw = getCurrentWeek();
  const lw = getLastWeek();
  const weeks = Object.keys(analytics.weekly_data).sort().reverse();

  if (weeks.length === 0) return null;

  return (
    <div className="panel fade-up">
      <div className="panel-title">WEEKLY_STATS</div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>WEEK_START</th>
              <th style={{ textAlign: "right" }}>COMMENTS</th>
              <th style={{ textAlign: "right" }}>LIKES</th>
              <th style={{ textAlign: "right" }}>KEYWORD</th>
              <th style={{ textAlign: "right" }}>KW_LIKES</th>
              <th style={{ textAlign: "right" }}>AVG_LEN</th>
              <th style={{ textAlign: "right" }}>%KW</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => {
              const w = analytics.weekly_data[week];
              const isCw = week === cw;
              const isLw = week === lw;
              const color = isCw ? "var(--neon-green)" : isLw ? "var(--neon-amber)" : "var(--text-primary)";
              const pct = w.comments ? ((w.keyword / w.comments) * 100).toFixed(0) : "0";
              const avgLen = w.comments ? Math.round(w.total_length / w.comments) : 0;
              return (
                <tr key={week}>
                  <td className="mono" style={{ color, fontWeight: isCw ? 700 : 400 }}>
                    {isCw && <span style={{ color: "var(--neon-teal)", marginRight: "0.4rem" }}>&#9646;</span>}
                    {formatWeekDisplay(week)}
                  </td>
                  <td style={{ textAlign: "right", color }} className="mono">{w.comments}</td>
                  <td style={{ textAlign: "right", color: "var(--neon-green)" }} className="mono">{w.likes.toLocaleString()}</td>
                  <td style={{ textAlign: "right", color: w.keyword > 0 ? "var(--neon-amber)" : color }} className="mono">{w.keyword}</td>
                  <td style={{ textAlign: "right", color }} className="mono">{w.keyword_likes.toLocaleString()}</td>
                  <td style={{ textAlign: "right", color }} className="mono">{avgLen}</td>
                  <td style={{ textAlign: "right", color }} className="mono">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

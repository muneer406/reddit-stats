"use client";
import { AnalyticsResult } from "@/types";
import { getCurrentWeek, getLastWeek } from "@/lib/analytics";

function getRowColor(date: string, cw: string, lw: string): string {
  try {
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const day = dt.getUTCDay();
    const sun = new Date(dt);
    sun.setUTCDate(dt.getUTCDate() - day);
    const week = sun.toISOString().slice(0, 10);
    if (week === cw) return "var(--neon-green)";
    if (week === lw) return "var(--neon-amber)";
  } catch {}
  return "var(--text-primary)";
}

interface Props { analytics: AnalyticsResult; }

export default function DailyTables({ analytics }: Props) {
  const cw = getCurrentWeek();
  const lw = getLastWeek();
  const dates = Object.keys(analytics.daily_data).sort().reverse();

  if (dates.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }} className="fade-up">
      {/* Activity */}
      <div className="panel">
        <div className="panel-title">DAILY_ACTIVITY</div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th style={{ textAlign: "right" }}>CMT</th>
                <th style={{ textAlign: "right" }}>KW</th>
                <th style={{ textAlign: "right" }}>%KW</th>
                <th style={{ textAlign: "right" }}>AVG_LEN</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => {
                const d = analytics.daily_data[date];
                const color = getRowColor(date, cw, lw);
                const pct = d.comments ? ((d.keyword / d.comments) * 100).toFixed(0) : "0";
                const avgLen = d.comments ? Math.round(d.total_length / d.comments) : 0;
                return (
                  <tr key={date}>
                    <td style={{ color }} className="mono">{date}</td>
                    <td style={{ textAlign: "right", color }} className="mono">{d.comments}</td>
                    <td style={{ textAlign: "right", color: d.keyword > 0 ? "var(--neon-amber)" : color }} className="mono">{d.keyword}</td>
                    <td style={{ textAlign: "right", color }} className="mono">{pct}%</td>
                    <td style={{ textAlign: "right", color }} className="mono">{avgLen}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engagement */}
      <div className="panel">
        <div className="panel-title">DAILY_ENGAGEMENT</div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th style={{ textAlign: "right" }}>LIKES</th>
                <th style={{ textAlign: "right" }}>KW_LIKES</th>
                <th style={{ textAlign: "right" }}>AVG/CMT</th>
                <th style={{ textAlign: "right" }}>AVG/KW</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => {
                const d = analytics.daily_data[date];
                const color = getRowColor(date, cw, lw);
                const avgLike = d.comments ? (d.likes / d.comments).toFixed(1) : "0";
                const avgKw = d.keyword ? (d.keyword_likes / d.keyword).toFixed(1) : "—";
                return (
                  <tr key={date}>
                    <td style={{ color }} className="mono">{date}</td>
                    <td style={{ textAlign: "right", color: "var(--neon-green)" }} className="mono">{d.likes.toLocaleString()}</td>
                    <td style={{ textAlign: "right", color: d.keyword_likes > 0 ? "var(--neon-amber)" : color }} className="mono">{d.keyword_likes.toLocaleString()}</td>
                    <td style={{ textAlign: "right", color }} className="mono">{avgLike}</td>
                    <td style={{ textAlign: "right", color }} className="mono">{avgKw}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";
import { AnalyticsResult, AppSettings } from "@/types";
import {
  getCurrentWeek,
  getLastWeek,
  formatWeekDisplay,
} from "@/lib/analytics";

interface Props {
  analytics: AnalyticsResult;
  settings: AppSettings;
}

function MiniProg({
  val,
  goal,
  color,
}: {
  val: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.max(0, Math.min((val / goal) * 100, 100)) : 0;
  return (
    <div>
      <div className="prog-track" style={{ height: 8 }}>
        <div
          className="prog-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
          }}
        />
      </div>
    </div>
  );
}

export default function WeeklyTable({ analytics, settings }: Props) {
  const cw = getCurrentWeek();
  const lw = getLastWeek();
  const weeks = Object.keys(analytics.weekly_data).sort().reverse();

  if (weeks.length === 0) return null;

  return (
    <div className="panel fade-up">
      <div className="panel-title">Weekly Stats</div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Week Start</th>
              <th style={{ textAlign: "right" }}>Comments</th>
              <th style={{ textAlign: "right" }}>Likes</th>
              <th style={{ textAlign: "right" }}>Keyword Mentions</th>
              <th style={{ textAlign: "right" }}>Keyword Likes</th>
              <th style={{ textAlign: "right" }}>Average Length</th>
              <th style={{ textAlign: "right" }}>% Keyword</th>
              <th style={{ textAlign: "center" }}>Comments Progress</th>
              <th style={{ textAlign: "center" }}>Keyword Progress</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => {
              const w = analytics.weekly_data[week];
              const isCw = week === cw;
              const isLw = week === lw;
              const color = isCw
                ? "var(--neon-green)"
                : isLw
                  ? "var(--neon-amber)"
                  : "var(--text-primary)";
              const pct = w.comments
                ? ((w.keyword / w.comments) * 100).toFixed(0)
                : "0";
              const avgLen = w.comments
                ? Math.round(w.total_length / w.comments)
                : 0;
              return (
                <tr key={week}>
                  <td
                    className="mono"
                    style={{ color, fontWeight: isCw ? 700 : 400 }}
                  >
                    {isCw && (
                      <span
                        style={{
                          color: "var(--neon-teal)",
                          marginRight: "0.4rem",
                        }}
                      >
                        &#9646;
                      </span>
                    )}
                    {formatWeekDisplay(week)}
                  </td>
                  <td style={{ textAlign: "right", color }} className="mono">
                    {w.comments}
                  </td>
                  <td
                    style={{ textAlign: "right", color: "var(--neon-green)" }}
                    className="mono"
                  >
                    {w.likes.toLocaleString()}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: w.keyword > 0 ? "var(--neon-amber)" : color,
                    }}
                    className="mono"
                  >
                    {w.keyword}
                  </td>
                  <td style={{ textAlign: "right", color }} className="mono">
                    {w.keyword_likes.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", color }} className="mono">
                    {avgLen}
                  </td>
                  <td style={{ textAlign: "right", color }} className="mono">
                    {pct}%
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <MiniProg
                      val={w.comments}
                      goal={settings.weeklyCommentGoal}
                      color="var(--neon-cyan)"
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <MiniProg
                      val={w.keyword}
                      goal={settings.weeklyKeywordGoal}
                      color="var(--neon-purple)"
                    />
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

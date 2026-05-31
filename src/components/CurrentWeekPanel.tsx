"use client";
import { AnalyticsResult, AppSettings } from "@/types";
import { getCurrentWeek, formatWeekDisplay } from "@/lib/analytics";

interface Props {
  analytics: AnalyticsResult;
  settings: AppSettings;
}

function ProgBar({
  val,
  goal,
  color,
}: {
  val: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min((val / goal) * 100, 100);
  const done = pct >= 100;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.3rem",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "0.62rem",
            color: done ? "var(--neon-green)" : color,
          }}
        >
          {val}/{goal}
        </span>
        <span
          className="mono"
          style={{
            fontSize: "0.62rem",
            color: done ? "var(--neon-green)" : "var(--text-secondary)",
          }}
        >
          {pct.toFixed(0)}%{done ? " [DONE]" : ""}
        </span>
      </div>
      <div className="prog-track">
        <div
          className="prog-fill"
          style={{
            width: `${pct}%`,
            background: done
              ? "linear-gradient(90deg, var(--neon-green), var(--neon-lime))"
              : `linear-gradient(90deg, ${color}99, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

export default function CurrentWeekPanel({ analytics, settings }: Props) {
  const cw = getCurrentWeek();
  const wd = analytics.weekly_data[cw];
  const comments = wd?.comments || 0;
  const keyword = wd?.keyword || 0;
  const likes = wd?.likes || 0;
  const kwLikes = wd?.keyword_likes || 0;

  return (
    <div className="panel fade-up">
      <div className="panel-corner tl" />
      <div className="panel-corner br" />
      <div className="panel-title">CURRENT_WEEK // {formatWeekDisplay(cw)}</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        {[
          { val: comments, label: "Comments", color: "var(--neon-teal)" },
          {
            val: keyword,
            label: `${settings.searchString} Mentions`,
            color: "var(--neon-amber)",
          },
          {
            val: likes.toLocaleString(),
            label: "Likes",
            color: "var(--neon-green)",
          },
          {
            val: kwLikes.toLocaleString(),
            label: `Keyword Likes`,
            color: "var(--neon-purple)",
          },
        ].map(({ val, label, color }) => (
          <div key={label} style={{ overflow: "hidden" }}>
            <div className="stat-val" style={{ color, fontSize: "1.4rem" }}>
              {val}
            </div>
            <div
              className="stat-lbl"
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div>
          <div
            className="mono"
            style={{
              fontSize: "0.6rem",
              color: "var(--text-secondary)",
              marginBottom: "0.3rem",
              letterSpacing: "0.1em",
            }}
          >
            COMMENT_GOAL
          </div>
          <ProgBar
            val={comments}
            goal={settings.weeklyCommentGoal}
            color="var(--neon-cyan)"
          />
        </div>
        <div>
          <div
            className="mono"
            style={{
              fontSize: "0.6rem",
              color: "var(--text-secondary)",
              marginBottom: "0.3rem",
              letterSpacing: "0.1em",
            }}
          >
            {settings.searchString} Goal
          </div>
          <ProgBar
            val={keyword}
            goal={settings.weeklyKeywordGoal}
            color="var(--neon-purple)"
          />
        </div>
      </div>
    </div>
  );
}

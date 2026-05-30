"use client";
import { AnalyticsResult } from "@/types";
import { formatWeekDisplay } from "@/lib/analytics";

interface Props {
  analytics: AnalyticsResult;
  settings: { weeklyCommentGoal: number; weeklyKeywordGoal: number };
  currentWeek: string;
}

export default function InsightsPanel({
  analytics,
  settings,
  currentWeek,
}: Props) {
  const weekly = analytics.weekly_data;
  const bestWeek = Object.entries(weekly)
    .sort((a, b) => b[1].comments - a[1].comments)
    .at(0);
  const bestDay = Object.entries(analytics.daily_data)
    .sort((a, b) => b[1].likes - a[1].likes)
    .at(0);
  const cwData = weekly[currentWeek];

  const rows = [
    {
      label: "Best Week",
      val: bestWeek
        ? `${formatWeekDisplay(bestWeek[0])} [${bestWeek[1].comments} comments / ${bestWeek[1].likes} likes]`
        : "N/A",
      color: "var(--neon-teal)",
    },
    {
      label: "Best Day By Likes",
      val: bestDay
        ? `${bestDay[0]} [${bestDay[1].likes} likes / ${bestDay[1].comments} comments]`
        : "N/A",
      color: "var(--neon-green)",
    },
    {
      label: "Active Days",
      val: `${Object.keys(analytics.daily_data).length}`,
      color: "var(--neon-cyan)",
    },
    {
      label: "Unique Subreddits",
      val: `${Object.keys(analytics.subreddit_counter).length}`,
      color: "var(--neon-purple)",
    },
    {
      label: "Average Comment Length",
      val: `${Math.round(analytics.avg_comment_length)} chars`,
      color: "var(--text-primary)",
    },
    {
      label: "Comment Goal Status",
      val: `${cwData?.comments || 0}/${settings.weeklyCommentGoal}`,
      color:
        (cwData?.comments || 0) >= settings.weeklyCommentGoal
          ? "var(--neon-green)"
          : "var(--neon-amber)",
    },
    {
      label: "Keyword Goal Status",
      val: `${cwData?.keyword || 0}/${settings.weeklyKeywordGoal}`,
      color:
        (cwData?.keyword || 0) >= settings.weeklyKeywordGoal
          ? "var(--neon-green)"
          : "var(--neon-amber)",
    },
  ];

  return (
    <div className="panel fade-up">
      <div className="panel-title">Insights</div>
      <div style={{ display: "grid", gap: "0" }}>
        {rows.map(({ label, val, color }, i) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: "1rem",
              padding: "0.5rem 0",
              borderBottom:
                i < rows.length - 1 ? "1px solid rgba(26,58,74,0.4)" : "none",
              alignItems: "center",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: "0.62rem",
                color: "var(--text-secondary)",
                letterSpacing: "0.1em",
              }}
            >
              {label}
            </span>
            <span className="mono" style={{ fontSize: "0.75rem", color }}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { AnalyticsResult } from "@/types";

interface Props {
  analytics: AnalyticsResult;
  usernames: string[];
  errors?: { username: string; error: string }[];
  stats?: { total_fetched: number; elapsed_ms: number };
}

function StatCard({ val, label, color }: { val: string; label: string; color: string }) {
  return (
    <div className="panel" style={{ padding: "1rem 1.25rem" }}>
      <div className="panel-corner tl" />
      <div className="panel-corner br" />
      <div className="stat-val" style={{ color }}>{val}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

export default function GlobalStats({ analytics, usernames, errors, stats }: Props) {
  const avgLikes = analytics.total_comments
    ? (analytics.total_likes / analytics.total_comments).toFixed(2)
    : "0";
  const kwPct = analytics.total_comments
    ? ((analytics.keyword_comments / analytics.total_comments) * 100).toFixed(1)
    : "0";

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <span className="orbitron" style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", color: "var(--text-secondary)" }}>
          GLOBAL.STATS
        </span>
        {stats && (
          <span className="mono" style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>
            [{stats.total_fetched} RECORDS / {usernames.length} USER{usernames.length > 1 ? "S" : ""} / {stats.elapsed_ms}ms]
          </span>
        )}
      </div>

      {errors && errors.length > 0 && (
        <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>
          {errors.map((e, i) => (
            <div key={i}>ERR: u/{e.username} — {e.error}</div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "0.6rem" }}>
        <StatCard val={analytics.total_comments.toLocaleString()} label="TOTAL_COMMENTS" color="var(--neon-teal)" />
        <StatCard val={analytics.total_likes.toLocaleString()} label="TOTAL_LIKES" color="var(--neon-green)" />
        <StatCard val={avgLikes} label="AVG_LIKES_PER_CMT" color="var(--neon-cyan)" />
        <StatCard val={analytics.keyword_comments.toLocaleString()} label="KEYWORD_HITS" color="var(--neon-amber)" />
        <StatCard val={`${kwPct}%`} label="KEYWORD_RATE" color="var(--neon-lime)" />
        <StatCard val={Object.keys(analytics.subreddit_counter).length.toLocaleString()} label="UNIQUE_SUBS" color="var(--neon-purple)" />
      </div>
    </div>
  );
}

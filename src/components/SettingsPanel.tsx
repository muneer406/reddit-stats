"use client";
import { AppSettings } from "@/types";

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
  open: boolean;
  onToggle: () => void;
}

function Field({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.5rem",
          marginBottom: "0.35rem",
        }}
      >
        <label
          className="mono"
          style={{
            fontSize: "0.62rem",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {label}
        </label>
        {note && (
          <span
            className="mono"
            style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}
          >
            {note}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "0.75rem",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <label style={{ marginLeft: "auto" }}>
        <div className="toggle">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="toggle-track" />
          <div className="toggle-thumb" />
        </div>
      </label>
      <span
        className="mono"
        style={{
          fontSize: "0.72rem",
          color: "var(--text-secondary)",
          textAlign: "right",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function SettingsPanel({
  settings,
  onChange,
  open,
  onToggle,
}: Props) {
  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="panel" style={{ padding: "1rem 1.25rem" }}>
      <button
        onClick={onToggle}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span className="panel-title" style={{ marginBottom: 0 }}>
            CONFIG / SETTINGS
          </span>
          <span
            className="mono"
            style={{
              fontSize: "0.65rem",
              color: "var(--text-secondary)",
              transition: "transform 0.2s",
              display: "inline-block",
              transform: open ? "rotate(180deg)" : "none",
            }}
          >
            &#x25BC;
          </span>
        </div>
      </button>

      {open && (
        <div
          className="fade-up"
          style={{ marginTop: "1.25rem", display: "grid", gap: "1rem" }}
        >
          {/* Search & Goals */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <Field label="KEYWORD">
              <input
                className="inp"
                type="text"
                value={settings.searchString}
                onChange={(e) => update("searchString", e.target.value)}
                placeholder="runable"
              />
            </Field>
            <Field label="WEEKLY COMMENT GOAL">
              <input
                className="inp"
                type="number"
                value={settings.weeklyCommentGoal}
                min={1}
                onChange={(e) =>
                  update(
                    "weeklyCommentGoal",
                    Math.max(1, Number(e.target.value)),
                  )
                }
              />
            </Field>
            <Field label="WEEKLY KEYWORD GOAL">
              <input
                className="inp"
                type="number"
                value={settings.weeklyKeywordGoal}
                min={1}
                onChange={(e) =>
                  update(
                    "weeklyKeywordGoal",
                    Math.max(1, Number(e.target.value)),
                  )
                }
              />
            </Field>
            <Field label="MAX COMMENTS / USER" note="[max 1000]">
              <input
                className="inp"
                type="number"
                value={settings.maxCommentsPerUser}
                min={10}
                max={1000}
                onChange={(e) =>
                  update(
                    "maxCommentsPerUser",
                    Math.max(10, Math.min(1000, Number(e.target.value))),
                  )
                }
              />
            </Field>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <Toggle
              checked={settings.showSubredditTable}
              onChange={(v) => update("showSubredditTable", v)}
              label="SUBREDDIT_TABLE"
            />
            <Toggle
              checked={settings.showTopComments}
              onChange={(v) => update("showTopComments", v)}
              label="TOP_COMMENTS"
            />
            <Toggle
              checked={settings.showCommentDetails}
              onChange={(v) => update("showCommentDetails", v)}
              label="COMMENT_DETAILS"
            />
          </div>
        </div>
      )}
    </div>
  );
}

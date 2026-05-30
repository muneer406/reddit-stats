"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { AnalyticsResult, AppSettings } from "@/types";
import { getCache, setCache, clearAllCache } from "@/lib/cache";
import { getCurrentWeek } from "@/lib/analytics";

import UserInput from "@/components/UserInput";
import SettingsPanel from "@/components/SettingsPanel";
import GlobalStats from "@/components/GlobalStats";
import CurrentWeekPanel from "@/components/CurrentWeekPanel";
import DailyTables from "@/components/DailyTables";
import WeeklyTable from "@/components/WeeklyTable";
import WeeklyComparison from "@/components/WeeklyComparison";
import SubredditTable from "@/components/SubredditTable";
import TopComments from "@/components/TopComments";
import InsightsPanel from "@/components/InsightsPanel";

const DEFAULT_SETTINGS: AppSettings = {
  searchString: "runable",
  weeklyCommentGoal: 160,
  weeklyKeywordGoal: 30,
  maxCommentsPerUser: 500,
  showSubredditTable: true,
  showTopComments: true,
  showCommentDetails: true,
};

interface FetchState {
  loading: boolean;
  error: string | null;
  analytics: AnalyticsResult | null;
  usernames: string[];
  errors?: { username: string; error: string }[];
  stats?: { total_fetched: number; elapsed_ms: number };
  cached: boolean;
}

// ─── Minimal matrix rain canvas ──────────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    const cols = () => Math.floor(canvas.width / 18);
    let drops: number[] = Array(cols()).fill(1);
    const chars = "01アイウエオカキクケコ█▓▒░ABCDEF";

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.fillStyle = "rgba(1,4,9,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,255,157,0.55)";
      ctx.font = "12px 'Share Tech Mono', monospace";
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 18, drops[i] * 18);
        if (drops[i] * 18 > canvas.height && Math.random() > 0.97) drops[i] = 0;
        drops[i]++;
      }
    };

    const handleResize = () => {
      resizeCanvas();
      drops = Array(cols()).fill(1);
    };

    window.addEventListener("resize", handleResize);
    const interval = setInterval(draw, 60);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-canvas" />;
}

export default function Home() {
  const [usernames, setUsernames] = useState<string[]>(["Murderous_monk"]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    analytics: null,
    usernames: [],
    cached: false,
  });
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const [scanActive, setScanActive] = useState(false);
  const lastScanAt = useRef<number>(0);
  const COOLDOWN_MS = 10_000; // 10 seconds cooldown to avoid spamming
  const [tick, setTick] = useState(0);

  // Clock tick for terminal cursor effect
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const doFetch = useCallback(
    async (usernamesToFetch: string[], skipCache = false) => {
      if (usernamesToFetch.length === 0) return;
      const searchKey = settings.searchString.toLowerCase();

      if (!skipCache) {
        const { entry, stale } = getCache<AnalyticsResult>(
          usernamesToFetch,
          searchKey,
        );
        if (entry) {
          setFetchState({
            loading: stale,
            error: null,
            analytics: entry.data,
            usernames: entry.usernames,
            cached: true,
          });
          if (!stale) return;
        }
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setFetchState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usernames: usernamesToFetch,
            searchString: searchKey,
            maxCommentsPerUser: settings.maxCommentsPerUser,
          }),
          signal: controller.signal,
        });

        if (!mountedRef.current) return;
        const data = await res.json();

        if (!res.ok || !data.success) {
          const { entry } = getCache<AnalyticsResult>(
            usernamesToFetch,
            searchKey,
          );
          if (entry) {
            setFetchState({
              loading: false,
              error: `API ERROR [${res.status}] — showing cached data`,
              analytics: entry.data,
              usernames: entry.usernames,
              cached: true,
            });
            return;
          }
          setFetchState({
            loading: false,
            error: data.error || `HTTP ${res.status}`,
            analytics: null,
            usernames: usernamesToFetch,
            cached: false,
          });
          return;
        }

        const analytics: AnalyticsResult = data.analytics;
        setCache(usernamesToFetch, searchKey, analytics);
        setFetchState({
          loading: false,
          error: null,
          analytics,
          usernames: usernamesToFetch,
          errors: data.errors,
          stats: data.stats,
          cached: false,
        });
      } catch (err) {
        if (!mountedRef.current) return;
        if (err instanceof Error && err.name === "AbortError") {
          setFetchState((prev) => ({
            ...prev,
            loading: false,
            error: "Scan stopped",
          }));
          return;
        }
        const msg = err instanceof Error ? err.message : "NETWORK_ERROR";
        const { entry } = getCache<AnalyticsResult>(
          usernamesToFetch,
          searchKey,
        );
        if (entry) {
          setFetchState({
            loading: false,
            error: `${msg} — showing cached data`,
            analytics: entry.data,
            usernames: entry.usernames,
            cached: true,
          });
          return;
        }
        setFetchState({
          loading: false,
          error: msg,
          analytics: null,
          usernames: usernamesToFetch,
          cached: false,
        });
      } finally {
        if (mountedRef.current && !controller.signal.aborted) {
          setScanActive(false);
        }
      }
    },
    [settings],
  );

  const toggleScanning = useCallback(() => {
    // anti-spam cooldown
    if (!scanActive && Date.now() - lastScanAt.current < COOLDOWN_MS) {
      const wait = Math.ceil(
        (COOLDOWN_MS - (Date.now() - lastScanAt.current)) / 1000,
      );
      setFetchState((s) => ({
        ...s,
        error: `Please wait ${wait}s before scanning again.`,
      }));
      return;
    }

    if (scanActive) {
      abortRef.current?.abort();
      setScanActive(false);
      return;
    }

    setScanActive(true);
    lastScanAt.current = Date.now();
    void doFetch(usernames, true)
      .then(() => {
        lastScanAt.current = Date.now();
      })
      .catch(() => {
        lastScanAt.current = Date.now();
      });
  }, [scanActive, doFetch, usernames]);

  const currentWeek = getCurrentWeek();

  const now = new Date();
  const timeStr = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

  return (
    <div className="page-shell">
      {/* ── Header ── */}
      <div
        style={{
          position: "relative",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          overflow: "hidden",
        }}
      >
        <MatrixRain />

        <div style={{ position: "relative", zIndex: 2, paddingTop: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <div
                className="orbitron"
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  lineHeight: 1,
                  background:
                    "linear-gradient(90deg, var(--neon-teal) 0%, var(--neon-green) 50%, var(--neon-cyan) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 12px rgba(0,255,213,0.5))",
                }}
              >
                REDDIT.ANALYTICS
              </div>
              <div
                className="mono"
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.3rem",
                  letterSpacing: "0.12em",
                }}
              >
                <span style={{ color: "var(--neon-teal)" }}>SYS</span>
                &gt; MULTI-USER PROFILE ANALYSIS // SUNDAY-BASED WEEKLY
                AGGREGATION
                <span className="cursor-blink" />
              </div>
              <div
                className="mono"
                style={{
                  fontSize: "0.55rem",
                  color: "var(--text-dim)",
                  marginTop: "0.15rem",
                  letterSpacing: "0.1em",
                }}
              >
                {timeStr}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {fetchState.cached && !fetchState.loading && (
                <span
                  className="mono"
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--neon-amber)",
                    border: "1px solid var(--neon-amber)",
                    padding: "0.2rem 0.5rem",
                  }}
                >
                  CACHED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Input section ── */}
      <div className="panel-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="panel">
          <UserInput
            usernames={usernames}
            onChange={setUsernames}
            loading={fetchState.loading}
          />
        </div>
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          open={settingsOpen}
          onToggle={() => setSettingsOpen(!settingsOpen)}
        />
      </div>

      <div
        className="panel action-panel fade-up"
        style={{ marginBottom: "1.5rem" }}
      >
        <div
          className="mono"
          style={{
            minWidth: 240,
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          }}
        >
          {scanActive
            ? "Scan mode enabled. Press STOP to cancel."
            : "Press START SCAN to retrieve Reddit analytics using server-side OAuth."}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            className="btn btn-primary"
            onClick={toggleScanning}
            disabled={usernames.length === 0 && !scanActive}
          >
            {fetchState.loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    border: "1.5px solid rgba(0,255,213,0.3)",
                    borderTopColor: "var(--neon-teal)",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
                SCANNING...
              </>
            ) : scanActive ? (
              "STOP SCAN"
            ) : (
              "START SCAN"
            )}
          </button>
          {fetchState.analytics && !fetchState.loading && (
            <button
              className="btn btn-ghost"
              onClick={() =>
                doFetch(
                  fetchState.usernames.length > 0
                    ? fetchState.usernames
                    : usernames,
                  true,
                )
              }
            >
              REFRESH
            </button>
          )}
        </div>
      </div>

      {/* ── Status messages ── */}
      {fetchState.error && (
        <div
          className="alert alert-error fade-up"
          style={{ marginBottom: "1rem" }}
        >
          [ERR] {fetchState.error}
        </div>
      )}
      {fetchState.cached && !fetchState.error && !fetchState.loading && (
        <div
          className="alert alert-warn fade-up"
          style={{ marginBottom: "1rem" }}
        >
          [CACHE] Displaying cached data. Press [R] REFRESH for live data.
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {fetchState.loading && !fetchState.analytics && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[120, 200, 160].map((h, i) => (
            <div key={i} className="panel">
              <div
                className="skel"
                style={{ width: "30%", height: 10, marginBottom: 12 }}
              />
              <div className="skel" style={{ width: "100%", height: h }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Results ── */}
      {fetchState.analytics && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <GlobalStats
            analytics={fetchState.analytics}
            usernames={fetchState.usernames}
            errors={fetchState.errors}
            stats={fetchState.stats}
          />
          <CurrentWeekPanel
            analytics={fetchState.analytics}
            settings={settings}
          />
          <DailyTables analytics={fetchState.analytics} settings={settings} />
          <WeeklyTable analytics={fetchState.analytics} settings={settings} />
          <WeeklyComparison analytics={fetchState.analytics} />

          {settings.showSubredditTable && (
            <SubredditTable analytics={fetchState.analytics} />
          )}

          {settings.showTopComments && (
            <>
              <TopComments analytics={fetchState.analytics} timeframe="week" />
              <TopComments analytics={fetchState.analytics} timeframe="all" />
              <TopComments
                analytics={fetchState.analytics}
                keywordOnly
                timeframe="week"
              />
              <TopComments
                analytics={fetchState.analytics}
                keywordOnly
                timeframe="all"
              />
            </>
          )}

          <InsightsPanel
            analytics={fetchState.analytics}
            settings={settings}
            currentWeek={currentWeek}
          />

          {/* Top Comment Detail */}
          {settings.showCommentDetails &&
            fetchState.analytics.highest_comment && (
              <div className="panel fade-up">
                <div className="panel-title">
                  TOP_COMMENT // HIGHEST_UPVOTED
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "0.3rem 1.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {[
                    [
                      "SCORE",
                      fetchState.analytics.highest_comment.ups,
                      "var(--neon-green)",
                    ],
                    [
                      "SUBREDDIT",
                      `r/${fetchState.analytics.highest_comment.subreddit}`,
                      "var(--neon-teal)",
                    ],
                    [
                      "DATE",
                      fetchState.analytics.highest_comment.date,
                      "var(--text-primary)",
                    ],
                  ].map(([k, v, c]) => (
                    <>
                      <span
                        key={`k-${k}`}
                        className="mono"
                        style={{
                          fontSize: "0.6rem",
                          color: "var(--text-secondary)",
                          alignSelf: "center",
                        }}
                      >
                        {k}
                      </span>
                      <span
                        key={`v-${k}`}
                        className="mono"
                        style={{ fontSize: "0.75rem", color: c as string }}
                      >
                        {v as string | number}
                      </span>
                    </>
                  ))}
                  <span
                    className="mono"
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--text-secondary)",
                      alignSelf: "center",
                    }}
                  >
                    LINK
                  </span>
                  <a
                    href={fetchState.analytics.highest_comment.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono"
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--neon-cyan)",
                      wordBreak: "break-all",
                    }}
                  >
                    {fetchState.analytics.highest_comment.link}
                  </a>
                </div>
                <div
                  className="mono"
                  style={{
                    padding: "0.75rem 1rem",
                    background: "var(--bg-void)",
                    border: "1px solid var(--border)",
                    borderLeft: "2px solid var(--neon-teal)",
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "var(--text-primary)",
                    maxHeight: 300,
                    overflowY: "auto",
                  }}
                >
                  {fetchState.analytics.highest_comment.body}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: "3rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          className="mono"
          style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}
        >
          REDDIT.ANALYTICS // PUBLIC JSON FEED + OAUTH API // NO ADS // NO
          TRACKING
        </span>
        <button
          onClick={() => {
            clearAllCache();
            window.location.reload();
          }}
          className="mono"
          style={{
            background: "none",
            border: "none",
            color: "var(--neon-red)",
            cursor: "pointer",
            fontSize: "0.6rem",
            textDecoration: "underline",
          }}
        >
          [CLR] CLEAR_CACHE
        </button>
      </div>
    </div>
  );
}

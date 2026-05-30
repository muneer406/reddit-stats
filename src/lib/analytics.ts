import type { RawComment, ProcessedComment, DayData, WeekData, AnalyticsResult } from "@/types";

function mostRecentSunday(dt: Date): Date {
  const day = dt.getUTCDay();
  const sunday = new Date(dt);
  sunday.setUTCDate(dt.getUTCDate() - day);
  sunday.setUTCHours(0, 0, 0, 0);
  return sunday;
}

export function utcToWeek(timestamp: number): string {
  const dt = new Date(timestamp * 1000);
  return mostRecentSunday(dt).toISOString().slice(0, 10);
}

export function utcToDate(timestamp: number): string {
  const dt = new Date(timestamp * 1000);
  return dt.toISOString().slice(0, 10);
}

export function getCurrentWeek(): string {
  return mostRecentSunday(new Date()).toISOString().slice(0, 10);
}

export function getLastWeek(): string {
  const thisSunday = mostRecentSunday(new Date());
  const lastSunday = new Date(thisSunday);
  lastSunday.setUTCDate(thisSunday.getUTCDate() - 7);
  return lastSunday.toISOString().slice(0, 10);
}

export function formatWeekDisplay(weekStr: string): string {
  if (!weekStr || weekStr.length < 10) return weekStr;
  const dt = new Date(weekStr + "T00:00:00Z");
  return dt.toLocaleDateString("en-US", {
    month: "short", day: "numeric", weekday: "short", timeZone: "UTC",
  });
}

const SEARCH_STRING_DEFAULT = "runable";

export function processComments(allComments: RawComment[], searchString?: string): AnalyticsResult {
  const needle = (searchString || SEARCH_STRING_DEFAULT).toLowerCase();
  const processed: ProcessedComment[] = [];
  const dailyData: Record<string, DayData> = {};
  const weeklyData: Record<string, WeekData> = {};
  const subredditCounter: Record<string, number> = {};
  let longestComment: ProcessedComment | null = null;
  let highestComment: ProcessedComment | null = null;

  function getDay(date: string): DayData {
    return dailyData[date] || (dailyData[date] = { comments: 0, keyword: 0, likes: 0, keyword_likes: 0, total_length: 0 });
  }
  function getWeek(week: string): WeekData {
    return weeklyData[week] || (weeklyData[week] = { comments: 0, keyword: 0, likes: 0, keyword_likes: 0, total_length: 0 });
  }

  for (const raw of allComments) {
    const c = raw.data;
    const body = c.body || "";
    const created = c.created_utc;
    const ups = c.ups || 0;
    if (!created) continue;

    const date = utcToDate(created);
    const week = utcToWeek(created);
    const permalink = "https://reddit.com" + (c.permalink || "");
    const containsKeyword = needle ? body.toLowerCase().includes(needle) : false;
    const subreddit = c.subreddit || "";
    const length = body.length;

    const d = getDay(date);
    d.comments += 1;
    d.keyword += containsKeyword ? 1 : 0;
    d.likes += ups;
    d.keyword_likes += containsKeyword ? ups : 0;
    d.total_length += length;

    const w = getWeek(week);
    w.comments += 1;
    w.keyword += containsKeyword ? 1 : 0;
    w.likes += ups;
    w.keyword_likes += containsKeyword ? ups : 0;
    w.total_length += length;

    subredditCounter[subreddit] = (subredditCounter[subreddit] || 0) + 1;

    const pc: ProcessedComment = { body, ups, date, week, subreddit, link: permalink, keyword: containsKeyword, length };
    processed.push(pc);

    if (!longestComment || length > longestComment.length) longestComment = pc;
    if (!highestComment || ups > highestComment.ups) highestComment = pc;
  }

  const totalComments = processed.length;
  const keywordComments = processed.filter((c) => c.keyword).length;
  const totalLikes = Object.values(dailyData).reduce((s, d) => s + d.likes, 0);
  const keywordLikes = Object.values(dailyData).reduce((s, d) => s + d.keyword_likes, 0);
  const totalLength = processed.reduce((s, c) => s + c.length, 0);
  const avgCommentLength = totalComments ? totalLength / totalComments : 0;

  return {
    processed, daily_data: dailyData, weekly_data: weeklyData, subreddit_counter: subredditCounter,
    total_comments: totalComments, keyword_comments: keywordComments, total_likes: totalLikes,
    keyword_likes: keywordLikes, avg_comment_length: avgCommentLength, longest_comment: longestComment, highest_comment: highestComment,
  };
}

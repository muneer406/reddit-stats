import type { RawComment } from "@/types";

const USER_AGENT = "reddit-stats-webapp/0.1 (by u/Murderous_monk)";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface RedditListing {
  kind: "Listing";
  data: {
    children: RawComment[];
    after: string | null;
    before: string | null;
    dist: number;
  };
}

export class RedditFetchError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public username?: string,
  ) {
    super(message);
    this.name = "RedditFetchError";
  }
}

// ─── OAuth Token Cache ────────────────────────────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new RedditFetchError(
      `OAuth token fetch failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new RedditFetchError("No access_token in OAuth response");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return cachedToken.token;
}

// ─── Page Fetching ────────────────────────────────────────────────────────────
async function fetchPage(
  username: string,
  after: string | null,
  limit: number,
  accessToken?: string,
): Promise<RedditListing> {
  const baseUrl = accessToken
    ? `https://oauth.reddit.com/user/${username}/comments`
    : `https://www.reddit.com/user/${username}/comments.json`;

  const url = new URL(baseUrl);
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("raw_json", "1");
  if (after) url.searchParams.set("after", after);

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString(), { headers });

      if (res.status === 429) {
        const wait = RETRY_DELAY_MS * attempt * 2;
        console.warn(`Rate limited fetching ${username}, waiting ${wait}ms...`);
        await sleep(wait);
        continue;
      }

      if (res.status === 404) {
        throw new RedditFetchError(
          `User "u/${username}" not found`,
          res.status,
          username,
        );
      }

      if (!res.ok) {
        throw new RedditFetchError(
          `Reddit API error: ${res.status} ${res.statusText}`,
          res.status,
          username,
        );
      }

      return await res.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError instanceof RedditFetchError) throw lastError;
      if (attempt < MAX_RETRIES) {
        console.warn(`Attempt ${attempt} failed for ${username}, retrying...`);
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw (
    lastError ||
    new RedditFetchError(`Failed to fetch comments for u/${username}`)
  );
}

// ─── User Comment Fetcher ─────────────────────────────────────────────────────
export async function fetchUserComments(
  username: string,
  maxComments: number,
  accessToken?: string,
): Promise<RawComment[]> {
  const all: RawComment[] = [];
  let after: string | null = null;

  console.log(
    `Fetching comments for u/${username} (max: ${maxComments || "all"}) via ${accessToken ? "OAuth API" : "public JSON"}`,
  );

  while (true) {
    const fetchLimit = maxComments
      ? Math.min(maxComments - all.length, 100)
      : 100;

    const page = await fetchPage(username, after, fetchLimit, accessToken);
    const children = page.data?.children || [];
    if (children.length === 0) break;

    for (const child of children) {
      if (child?.data?.body) {
        all.push(child);
      }
    }

    if (maxComments && all.length >= maxComments) {
      console.log(`Reached max ${maxComments} comments for u/${username}`);
      break;
    }

    after = page.data?.after || null;
    if (!after) break;
  }

  console.log(`Fetched ${all.length} comments for u/${username}`);
  return all;
}

// ─── Multi-User Fetcher ───────────────────────────────────────────────────────
export async function fetchMultipleUsers(
  usernames: string[],
  maxCommentsPerUser: number,
  clientId?: string,
  clientSecret?: string,
): Promise<{
  comments: RawComment[];
  errors: { username: string; error: string }[];
}> {
  const allComments: RawComment[] = [];
  const errors: { username: string; error: string }[] = [];

  // Get OAuth token with the provided server credentials
  let accessToken: string | undefined;
  if (clientId && clientSecret) {
    accessToken = await getAccessToken(clientId, clientSecret);
    console.log("[Reddit] Using OAuth API");
  } else {
    throw new RedditFetchError("Missing Reddit OAuth credentials");
  }

  const results = await Promise.allSettled(
    usernames.map((u) =>
      fetchUserComments(u.trim(), maxCommentsPerUser, accessToken),
    ),
  );

  for (let i = 0; i < usernames.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      allComments.push(...r.value);
    } else {
      const msg =
        r.reason instanceof RedditFetchError
          ? r.reason.message
          : r.reason instanceof Error
            ? r.reason.message
            : "Unknown error";
      errors.push({ username: usernames[i], error: msg });
    }
  }

  return { comments: allComments, errors };
}

import { NextRequest, NextResponse } from "next/server";
import { fetchMultipleUsers, RedditFetchError } from "@/lib/reddit";
import { processComments } from "@/lib/analytics";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const usernames: string[] = (body.usernames || [])
      .map((u: string) => u.trim().replace(/^u\/?/i, ""))
      .filter(Boolean);
    const searchString: string = body.searchString || "runable";
    const maxCommentsPerUser: number = Math.min(
      body.maxCommentsPerUser || 500,
      1000,
    );
    // OAuth credentials are loaded only from the server environment
    const clientId: string | undefined = process.env.REDDIT_CLIENT_ID;
    const clientSecret: string | undefined = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Reddit OAuth credentials. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env.local",
        },
        { status: 500 },
      );
    }

    if (usernames.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one username is required" },
        { status: 400 },
      );
    }

    console.log(
      `[API] Fetching for: ${usernames.join(", ")} | search="${searchString}" | max=${maxCommentsPerUser} | oauth=${!!(clientId && clientSecret)}`,
    );

    const { comments, errors } = await fetchMultipleUsers(
      usernames,
      maxCommentsPerUser,
      clientId,
      clientSecret,
    );

    if (comments.length === 0 && errors.length > 0) {
      const msg = errors.map((e) => `u/${e.username}: ${e.error}`).join("; ");
      return NextResponse.json(
        { success: false, error: msg, usernames, errors },
        { status: 422 },
      );
    }

    const analytics = processComments(comments, searchString);

    const elapsed = Date.now() - startTime;
    console.log(
      `[API] Done in ${elapsed}ms: ${comments.length} comments across ${usernames.length} users`,
    );

    return NextResponse.json({
      success: true,
      usernames,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        total_fetched: comments.length,
        elapsed_ms: elapsed,
      },
      analytics,
    });
  } catch (err) {
    const msg =
      err instanceof RedditFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Internal server error";
    console.error("[API] Unhandled error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

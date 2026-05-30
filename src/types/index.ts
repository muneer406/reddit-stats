export interface RawComment {
  data: {
    id: string;
    body: string;
    created_utc: number;
    ups: number;
    subreddit: string;
    permalink: string;
  };
}

export interface ProcessedComment {
  body: string;
  ups: number;
  date: string;
  week: string;
  subreddit: string;
  link: string;
  keyword: boolean;
  length: number;
}

export interface DayData {
  comments: number;
  keyword: number;
  likes: number;
  keyword_likes: number;
  total_length: number;
}

export interface WeekData {
  comments: number;
  keyword: number;
  likes: number;
  keyword_likes: number;
  total_length: number;
}

export interface AnalyticsResult {
  processed: ProcessedComment[];
  daily_data: Record<string, DayData>;
  weekly_data: Record<string, WeekData>;
  subreddit_counter: Record<string, number>;
  total_comments: number;
  keyword_comments: number;
  total_likes: number;
  keyword_likes: number;
  avg_comment_length: number;
  longest_comment: ProcessedComment | null;
  highest_comment: ProcessedComment | null;
}

export interface AppSettings {
  searchString: string;
  weeklyCommentGoal: number;
  weeklyKeywordGoal: number;
  maxCommentsPerUser: number;
  showSubredditTable: boolean;
  showTopComments: boolean;
  showCommentDetails: boolean;
}

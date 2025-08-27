import { task, logger, schedules } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import path from "path";
import { google } from "googleapis";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// YouTube Data API setup
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const BLOOMBERG_CHANNEL_ID = "UCUMZ7gohGI9HcU9VNsr2FJQ"; // Bloomberg channel

// Task to fetch videos from Bloomberg channel
export const fetchBloombergVideos = task({
  id: "fetch-bloomberg-videos",
  machine: "medium-1x",
  retry: {
    outOfMemory: { machine: "large-1x" }
  },
  run: async (payload, { ctx }) => {

    // Get yesterday's date
    const yesterday = new Date();
    // Convert to UTC-5
    yesterday.setHours(yesterday.getHours() - 5);
    yesterday.setDate(yesterday.getDate() - 1);

    // Set fixed time to 00:00:10 UTC
    yesterday.setUTCHours(0, 0, 10, 0);

    const publishedAfter = yesterday.toISOString();

    logger.log("Fetching videos published after", { 
      publishedAfter: publishedAfter 
    });

    // Fetch videos
    const youtube = google.youtube({
      version: "v3",
      auth: YOUTUBE_API_KEY,
    });

    const res = await youtube.search.list({
      channelId: BLOOMBERG_CHANNEL_ID,
      part: ["id", "snippet"],
      order: "date",
      publishedAfter,
      maxResults: 50,
      type: ["video"],
    });

    // Check if the response is empty
    if (!res.data.items) {
      logger.error("No videos found for the given channel and date range.");
      return [];

    } else {
      const result = await generateObject({
        model: openai("gpt-5-mini"),
        output: "array",
        schema: z.object({
          title: z.string(),
          id: z.string(),
          publishedAt: z.string(),
          image: z.string()
        }),
        prompt: `Extract the title, id, default thumbnail image url, and publishedAt from the following JSON: ${JSON.stringify(res.data.items)}.`,
      });

      return result.object;
    }

  },
});
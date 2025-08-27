import { task, logger, schemaTask } from "@trigger.dev/sdk/v3";
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import { z } from "zod";
import axios from "axios";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";


export const extractTranscripts = schemaTask({
    id: "extract-transcripts",
    machine: "medium-1x",
    retry: {
        outOfMemory: { machine: "large-1x" }
      },
    schema: z.object({
		video_id: z.string(),
        title: z.string(),
        image: z.string(),
	}),
    run: async (payload, { ctx }) => {
        // Using SearchAPI
        const url = "https://www.searchapi.io/api/v1/search";
        // Params
        const params = {
            engine: "youtube_transcripts",
            video_id: payload.video_id,
            api_key: process.env.SEARCH_API_KEY,
          };
        
        try {
        const response = await axios.get(url, { params });
        const data = response.data;
    
        if (!data.transcripts || data.transcripts.length === 0) {
            logger.error("No transcript found for video", { video_id: payload.video_id });
            return;
        }
    
        // Concatenate transcript
        const fullText = data.transcripts.map((item: { text: string }) => item.text).join(" ");

        // Summarize the transcript
        const summaryText = await generateObject({
            model: openai("gpt-5-nano"),
            output: "object",
            schema: z.object({
                summary: z.string(),
            }),
            prompt: `
            You are an expert summarizer specialized in technology, business, innovation, and culture topics. 
            You will receive the full transcript of a Bloomberg Originals YouTube video. These videos typically last around 15 minutes, so the transcript may be long.

            Your task is to create a to-go style newsletter summary that captures the 4 main topics discussed in the video. 
            For each topic, write 1 concise yet insightful paragraph explaining it clearly and engagingly, so the reader can understand the essence of the video without watching it.

            Use a friendly but professional tone, similar to modern tech newsletters, avoiding unnecessary jargon but keeping key terms when important. Make it easy to read in an email.

            Guidelines:
            - Identify the 4 most important themes or storylines in the transcript.
            - For each theme, provide a short, catchy heading (max 6 words) and 1 paragraph explaining it. Each paragraph should be separated by a blank line for readability.
            - For each theme, include some emojis to make it more user-friendly. Just add emojis in the heading of each theme, avoid adding emojis inside the paragraph. Each theme title should be separated by a blank line for readability. 
            - The heading of each theme must be in bold (**like this**). 
            - Keep it concise, powerful, and engaging.
            - Avoid filler words and unrelated details.
            - Do not include introductions or conclusions—jump straight into the main topics.
            - Always generate the newsletter summary in Spanish.

            Input: ${fullText}
            Output: Plain text newsletter-style summary with 4 clearly separated topics, each followed by 1 short paragraph.
                `
        });
    
        return {
            video_id: payload.video_id,
            title: payload.title,
            transcript: summaryText.object,
            image: payload.image,
        };
        } catch (error) {
        logger.error("Error fetching transcript", { error });
        }

    }
});

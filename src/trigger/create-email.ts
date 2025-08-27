import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { z } from "zod";

export const createEmailContent = schemaTask({
	id: "create-email-content",
	machine: "medium-1x",
	retry: {
		outOfMemory: { machine: "large-1x" }
	  },
	schema: z.object({
		summaries: z.array(
			z.object({
				title: z.string(),
				transcript: z.string(),
			}),
		),
	}),
	run: async (payload) => {
		const finalSummaryWithLinksPrompt = `
        You are preparing a daily email for a user. Below is the summary and title of the Youtube video from Bloomberg Originals Channel for yesterday.
        
        Summaries:
        ${payload.summaries
					.map((article, idx) => {
						const summary = article.transcript;
						return `${idx + 1}. [${article.title}](${article.title}): ${summary}`;
					})
					.join("\n")}
        
        Write a friendly, concise daily email in Spanish to the user that includes this summary with its video title. Begin with a short greeting and mention that this is yesterday's video from Bloomberg Originals. Do not include any extra commentary or instructions. Return stylish HTML that can be used in an email. Just the HTML, no other text. The final output MUST be in Spanish. Our audience is Spanish speaking.
		Extra guidelines:
		1. Ensure that both the video's title and summary are in spanish.
		2. The heading of each theme must be in bold (**like this**).
        `;
		const result = await generateText({
			model: openai("gpt-5-nano"),
			prompt: finalSummaryWithLinksPrompt,
		});

		return result.text;
	},
});
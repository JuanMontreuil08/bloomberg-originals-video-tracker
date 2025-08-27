import { fetchBloombergVideos } from "./get-youtube-videos";
import { schedules } from "@trigger.dev/sdk/v3";
import { extractTranscripts } from "./extract-transcripts-task";
import { createEmailContent } from "./create-email";
import { Resend } from "resend";

const resend = new Resend("your_resend_api");

// Get yesterday's date
const yesterday = new Date();
// Convert to UTC-5
yesterday.setHours(yesterday.getHours() - 5);
yesterday.setDate(yesterday.getDate() - 1);

// Format as DD/MM/YYYY
const emailDate = yesterday.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: '2-digit', 
  year: 'numeric'
});

export const monitorBloombergVideos = schedules.task({
    id: "monitor-bloomberg-videos",
    machine: "medium-1x",
    retry: {
      outOfMemory: { machine: "large-1x" }
    },
    cron: "0 14 * * *", // every day at 9am PET
    run: async (payload, { ctx }) => {
        const videos = await fetchBloombergVideos.triggerAndWait();

        if (!videos.ok || !videos.output || videos.output.length === 0) {
            console.log(`No videos for ${emailDate}.`);
        } 
        else {

          const transcripts = await extractTranscripts.batchTriggerAndWait(
            videos.output.map((article) => ({
              payload: {
                video_id: article.id,
                title: article.title,
                image: article.image,
              },
            }))
          );

          // Generate email message
          const videos2: { title: string; transcript: string }[] = [];

          // Save images url
          const image : {img: string}[] = [];

          for (const run of transcripts.runs) {
            if (run.ok && run.output) {
              videos2.push({
                title: run.output.title,
                transcript: run.output.transcript.summary,
              });
              image.push({
                img: run.output.image,
              })
            }
          }

          const emailContent = await createEmailContent.triggerAndWait({
            summaries: videos2,
          });
      
          if (!emailContent.ok) {
            throw new Error("No email content");
          }

          // Template body
          function renderCenteredEmail(innerHtml: string, img: string) {
            const imgHtml = img
            ? `<a style="text-decoration:none;border:0;outline:0;">
                 <img src="${img}" alt="Video thumbnail" width="180" align="right"
                      style="display:block;border:0;outline:0;border-radius:10px;margin:0 0 8px 16px;">
               </a>`
            : "";
        
          return `<!doctype html>
        <html>
          <body style="margin:0;padding:0;background:#f6f9fc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9fc;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center"
                         style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;">
                    <tr>
                      <td style="padding:24px 24px 24px 24px;font-family:Arial, sans-serif;color:#111827;line-height:1.55;">
                        ${imgHtml}
                        ${innerHtml}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>`;
          }

          const html_op = renderCenteredEmail(emailContent.output, image[0].img);

          const result = await resend.emails.send({
            from: "BO Videos <BOriginals@juanmontreuil.com>",
            to: "your_email_account",
            subject: `Inside Bloomberg Originals’ Bold New Release - ${emailDate}`,
            html: html_op,
          });
      
          if (result.error) {
            throw new Error(result.error.message);
          }
      
          return "Email sent";


        }

    },
});

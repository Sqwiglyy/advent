# The Meme Advent Calendar

Twenty-four doors open from December 1 through December 24, 2026 at midnight in Europe/London. Each remains available after its date. GitHub Pages hosts the calendar and a Cloudflare Worker checks its own clock before revealing a video ID. The Worker also sends feedback to Discord.

## Set up

1. Create a GitHub repository and upload the extracted project files. In **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/docs**. The site URL will appear in Pages settings. Keep your videos and webhook out of the repository.
2. In Cloudflare **Workers & Pages**, create a Worker with the Hello World starter. In the Worker editor, replace the starter code with the contents of `worker/worker.mjs` and deploy. Copy its HTTPS URL.
3. In the Worker's **Settings → Variables and Secrets**, add the following and deploy the settings.

| Name | Type | Value |
| --- | --- | --- |
| `SITE_ORIGIN` | Text | The Pages site's origin, such as `https://yourname.github.io`. Omit the repository path and trailing slash. |
| `VIDEO_IDS` | Secret | A JSON object keyed by day, such as `{"1":"FIRST_ID","2":"SECOND_ID"}`. Replace the placeholders with actual 11-character YouTube IDs and continue through day 24. |
| `DISCORD_WEBHOOK_URL` | Secret | The full webhook URL from your Discord channel's **Edit Channel → Integrations → Webhooks**. |
| `FEEDBACK_CODE` | Secret | A long random passphrase. Share it privately with your friend. |

4. Set `api` at the top of `docs/calendar.js` to your Worker URL without a trailing slash. Commit that change. Once Pages redeploys, share its URL and the feedback code with your friend.

## Choose videos and test

In a YouTube URL such as `https://www.youtube.com/watch?v=VIDEO_ID`, take the value after `v=`. For a `youtu.be` link, take the first part after the slash. Use videos that allow embedding. The player requests autoplay and includes a YouTube link if autoplay is blocked or the embed fails.

To test early, use a **separate** test Worker with only a test video and set its year to a past year. Point a local copy of the frontend at that Worker and set its `SITE_ORIGIN` to your local server origin. Run `python3 -m http.server 8000 --directory docs` from the project and visit `http://localhost:8000`. Set the test Worker's webhook to a test Discord channel before submitting feedback.

GitHub Pages serves the calendar publicly. Anyone who visits can open doors after their release dates. The feedback code is required to send a message. The Worker protects advance reveals through this calendar. A video can still be found independently on YouTube.

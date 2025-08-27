# 📰 Bloomberg Daily Digest

A friendly bot that watches Bloomberg Originals YouTube channel and sends you a daily email with video summaries in Spanish! 🇪��

## ✨ What it does

- 📺 Finds yesterday's videos from Bloomberg Originals
- 🧠 Uses AI to summarize what each video is about
- 📧 Sends you a beautiful email with all the summaries
- ⏰ Runs automatically every day at 9 AM (Peru time)

## 🛠️ Built with

- **Trigger.dev** - Makes everything run smoothly
- **YouTube API** - Gets the videos
- **OpenAI** - Summarizes the content
- **Resend** - Sends the emails

## �� Quick Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your environment
Create a `.env` file:
```env
YOUTUBE_API_KEY="your_api_key"
OPENAI_API_KEY="your_api_key"
SEARCH_API_KEY="your_api_key"
RESEND_API_KEY="your_api_key"
```

### 3. Deploy
```bash
npx trigger.dev@latest deploy
```

That's it! 🎉 Your bot will start sending daily emails automatically.

## �� Project Structure

src/trigger/
├── bloomberg-originals.ts # Main bot (runs daily)
├── get-youtube-videos.ts # Gets videos from YouTube
├── extract-transcripts-task.ts # Summarizes videos
└── create-email.ts # Creates the email

*Made with ❤️ for keeping up with Bloomberg content*

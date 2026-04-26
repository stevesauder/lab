# YouTube Video App

A simple web app that generates lists of YouTube videos based on topics or AI suggestions.

## How to Run

For the YouTube search to work, run this app through Netlify so the private API key stays on the server side.

1. Install the Netlify CLI if needed: `npm install -g netlify-cli`
2. Create a local `.env` file with `YOUTUBE_API_KEY=your_key_here`.
3. Run `netlify dev`.
4. Open the local URL that Netlify prints.

Opening `index.html` directly, or using `python3 -m http.server`, will load the page but cannot run the Netlify Function that calls YouTube.

## Features

- Enter a topic to generate a list of related videos.
- Use "AI Suggest" for a curated list.
- Refresh or delete videos in the list.

## YouTube API Setup

This app now fetches real YouTube search results.

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an API key for the YouTube Data API v3.
3. In Netlify, set an environment variable named `YOUTUBE_API_KEY`.
4. Deploy the site to Netlify.

Do not put the API key in browser JavaScript. The frontend calls the Netlify Function at `/.netlify/functions/youtube-search`, and that function reads the key from the server environment.

# YouTube Video App

A simple web app that generates lists of YouTube videos based on topics or AI suggestions.

## How to Run

1. Make sure you have Python 3 installed.
2. Run `npm start` to start the local server on port 8000.
3. Open your browser and go to `http://localhost:8000`.

Alternatively, you can run `python3 -m http.server 8000` directly.

## Features

- Enter a topic to generate a list of related videos.
- Use "AI Suggest" for a curated list.
- Refresh or delete videos in the list.

## YouTube API Setup

This app now fetches real YouTube search results.

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an API key for the YouTube Data API v3.
3. Open `config.js` and replace `YOUR_API_KEY_HERE` with your key.
4. Run the app with `npm start` or `python3 -m http.server 8000`.

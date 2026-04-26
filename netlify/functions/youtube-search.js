exports.handler = async (event) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const query = event.queryStringParameters?.q?.trim();
    const pageToken = event.queryStringParameters?.pageToken || '';

    if (!apiKey) {
        return jsonResponse(500, {
            error: 'Missing YOUTUBE_API_KEY environment variable.'
        });
    }

    if (!query) {
        return jsonResponse(400, {
            error: 'Missing search query.'
        });
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '25');
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('relevanceLanguage', 'en');
    url.searchParams.set('safeSearch', 'moderate');
    url.searchParams.set('videoDuration', 'any');
    url.searchParams.set('q', query);
    url.searchParams.set('key', apiKey);
    if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
    }

    try {
        const response = await fetch(url.toString());
        const body = await response.json();

        if (!response.ok) {
            return jsonResponse(response.status, {
                error: body.error?.message || 'YouTube API request failed.'
            });
        }

        return jsonResponse(200, body);
    } catch (error) {
        return jsonResponse(500, {
            error: error.message || 'YouTube search failed.'
        });
    }
};

const jsonResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
});

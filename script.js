const videoList = document.getElementById('videoList');
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const aiBtn = document.getElementById('aiBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusMessage = document.getElementById('statusMessage');

const configuredYouTubeApiKey = typeof YOUTUBE_API_KEY !== 'undefined' ? YOUTUBE_API_KEY : 'YOUR_API_KEY_HERE';
let currentVideos = [];
let lastQuery = '';
let searchPageToken = '';
let replacementQueue = [];

const qualitySearchTerms = [
    'thoughtful',
    'in depth',
    'long form',
    'documentary',
    'lecture',
    'high quality'
];

const tasteProfiles = [
    {
        keywords: ['nature', 'forest', 'ocean', 'mountain', 'rain', 'landscape', 'walk'],
        terms: ['cinematic', 'quiet', '4k', 'no talking', 'slow']
    },
    {
        keywords: ['meditation', 'mindfulness', 'presence', 'stillness', 'awareness'],
        terms: ['guided', 'calm', 'eckhart tolle', 'talk', 'deep']
    },
    {
        keywords: ['photography', 'photo', 'film', 'camera', 'composition', 'seeing'],
        terms: ['composition', 'visual essay', 'masterclass', 'street photography']
    },
    {
        keywords: ['thinking', 'philosophy', 'ai', 'creativity', 'mind', 'meaning'],
        terms: ['conversation', 'lecture', 'deep dive', 'interview']
    },
    {
        keywords: ['craft', 'wood', 'build', 'maker', 'material', 'design'],
        terms: ['process', 'quiet', 'handmade', 'workshop']
    },
    {
        keywords: ['music', 'ambient', 'piano', 'sound', 'focus'],
        terms: ['full album', 'minimal', 'calm', 'focus']
    }
];

const lowQualitySignals = [
    '#shorts',
    'shorts',
    'tiktok',
    'reaction',
    'prank',
    'gone wrong',
    "you won't believe",
    'shocking',
    'insane',
    'must watch',
    'compilation'
];

const showStatus = (message, isError = false) => {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? '#d32f2f' : '#666';
};

const cleanText = (text = '') => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value.replace(/\s+/g, ' ').trim();
};

const buildTasteAwareQuery = (query) => {
    const normalizedQuery = query.toLowerCase();
    const matchedProfile = tasteProfiles.find(profile =>
        profile.keywords.some(keyword => normalizedQuery.includes(keyword))
    );
    const profileTerms = matchedProfile ? matchedProfile.terms.slice(0, 3) : [];
    const terms = [...new Set([...profileTerms, 'in depth', 'documentary'])];
    return `${query} ${terms.join(' ')}`;
};

const scoreVideo = (video, query) => {
    const haystack = `${video.title} ${video.description} ${video.channelTitle}`.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    if (haystack.includes(normalizedQuery)) score += 6;
    qualitySearchTerms.forEach(term => {
        if (haystack.includes(term)) score += 2;
    });
    tasteProfiles.forEach(profile => {
        profile.terms.forEach(term => {
            if (haystack.includes(term)) score += 1;
        });
    });
    lowQualitySignals.forEach(signal => {
        if (haystack.includes(signal)) score -= 8;
    });

    return score;
};

const chooseQualityVideos = (items, query) => {
    const seen = new Set();
    return items
        .map(item => ({
            id: item.id.videoId,
            title: cleanText(item.snippet.title),
            description: cleanText(item.snippet.description),
            channelTitle: cleanText(item.snippet.channelTitle)
        }))
        .filter(video => video.id && !seen.has(video.id) && seen.add(video.id))
        .filter(video => {
            const haystack = `${video.title} ${video.description}`.toLowerCase();
            return !lowQualitySignals.some(signal => haystack.includes(signal));
        })
        .sort((a, b) => scoreVideo(b, query) - scoreVideo(a, query))
        .slice(0, 10);
};

const prepareVideoResults = (items, query) => {
    const seen = new Set();
    return items
        .map(item => ({
            id: item.id.videoId,
            title: cleanText(item.snippet.title),
            description: cleanText(item.snippet.description),
            channelTitle: cleanText(item.snippet.channelTitle)
        }))
        .filter(video => video.id && !seen.has(video.id) && seen.add(video.id))
        .filter(video => {
            const haystack = `${video.title} ${video.description}`.toLowerCase();
            return !lowQualitySignals.some(signal => haystack.includes(signal));
        })
        .sort((a, b) => scoreVideo(b, query) - scoreVideo(a, query));
};

const renderList = (videos) => {
    videoList.innerHTML = '';

    if (videos.length === 0) {
        showStatus('No matching videos found for your search.');
        return;
    }

    showStatus('');
    videos.forEach(video => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `https://www.youtube.com/watch?v=${video.id}`;
        a.onclick = (e) => {
            e.preventDefault();
            window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
        };
        a.textContent = video.title;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteVideo(video);

        li.appendChild(a);
        li.appendChild(deleteBtn);
        videoList.appendChild(li);
    });
};

const requestYouTubeSearch = async (query, pageToken = '') => {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '25');
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('relevanceLanguage', 'en');
    url.searchParams.set('safeSearch', 'moderate');
    url.searchParams.set('videoDuration', 'any');
    url.searchParams.set('q', query);
    url.searchParams.set('key', configuredYouTubeApiKey);
    if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`YouTube API request failed: ${response.status} ${response.statusText} ${body}`);
    }

    const data = await response.json();
    if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Unexpected YouTube API response.');
    }

    return data;
};

const searchYouTube = async (query) => {
    if (!configuredYouTubeApiKey || configuredYouTubeApiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('Missing YouTube API key. Please set YOUTUBE_API_KEY in config.js.');
    }

    const tasteAwareData = await requestYouTubeSearch(buildTasteAwareQuery(query));
    searchPageToken = tasteAwareData.nextPageToken || '';
    const tasteAwareVideos = prepareVideoResults(tasteAwareData.items, query);
    if (tasteAwareVideos.length > 0) {
        replacementQueue = tasteAwareVideos.slice(10);
        return tasteAwareVideos.slice(0, 10);
    }

    const fallbackData = await requestYouTubeSearch(query);
    searchPageToken = fallbackData.nextPageToken || '';
    const fallbackVideos = prepareVideoResults(fallbackData.items, query);
    replacementQueue = fallbackVideos.slice(10);
    return fallbackVideos.slice(0, 10);
};

const getReplacementVideo = async () => {
    if (!lastQuery) return null;

    const existingIds = new Set(currentVideos.map(video => video.id));
    while (replacementQueue.length > 0) {
        const queuedVideo = replacementQueue.shift();
        if (!existingIds.has(queuedVideo.id)) {
            return queuedVideo;
        }
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const data = await requestYouTubeSearch(buildTasteAwareQuery(lastQuery), searchPageToken);
        searchPageToken = data.nextPageToken || '';
        const candidates = prepareVideoResults(data.items, lastQuery)
            .filter(video => !existingIds.has(video.id));

        if (candidates.length > 0) {
            replacementQueue = candidates.slice(1);
            return candidates[0];
        }
    }

    return null;
};

const loadSearchResults = async (query) => {
    if (!query) {
        showStatus('Please enter a search term.');
        return;
    }

    showStatus('Searching YouTube...');
    try {
        lastQuery = query;
        searchPageToken = '';
        replacementQueue = [];
        currentVideos = await searchYouTube(query);
        renderList(currentVideos);
    } catch (error) {
        currentVideos = [];
        videoList.innerHTML = '';
        showStatus(error.message, true);
    }
};

const deleteVideo = async (video) => {
    const index = currentVideos.findIndex(v => v.id === video.id);
    if (index === -1) return;
    currentVideos.splice(index, 1);
    renderList(currentVideos);

    if (currentVideos.length >= 10) return;

    showStatus('Finding a replacement video...');
    try {
        const replacementVideo = await getReplacementVideo();
        if (!replacementVideo) {
            renderList(currentVideos);
            showStatus('Deleted video. No replacement found yet.');
            return;
        }

        currentVideos.unshift(replacementVideo);
        renderList(currentVideos.slice(0, 10));
        currentVideos = currentVideos.slice(0, 10);
    } catch (error) {
        renderList(currentVideos);
        showStatus(`Deleted video, but replacement failed: ${error.message}`, true);
    }
};

const refreshVideos = () => {
    if (!lastQuery) {
        showStatus('Search first before refreshing a video.', true);
        return;
    }

    loadSearchResults(lastQuery);
};

// Event listeners
generateBtn.addEventListener('click', () => loadSearchResults(topicInput.value.trim()));
aiBtn.addEventListener('click', () => loadSearchResults('ambient nature meditation'));
refreshBtn.addEventListener('click', refreshVideos);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadSearchResults(topicInput.value.trim());
    }
});

// Initial page state
showStatus('Enter a topic and click Generate List to search YouTube.');

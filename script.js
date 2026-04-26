const videoList = document.getElementById('videoList');
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const aiBtn = document.getElementById('aiBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusMessage = document.getElementById('statusMessage');

let currentVideos = [];
let lastQuery = '';
let searchPageToken = '';
let replacementQueue = [];
let lastSearchSignature = '';
let variationIndex = 0;
const recentlyShownVideoIds = new Set();

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

const searchVariations = [
    ['thoughtful', 'documentary', 'in depth'],
    ['best', 'expert', 'guide'],
    ['visual essay', 'conversation', 'insightful'],
    ['quiet', 'slow', 'cinematic'],
    ['masterclass', 'lecture', 'explained'],
    ['underrated', 'high quality', 'long form']
];

const currentEventSignals = [
    'latest',
    'news',
    'today',
    'recent',
    'breaking',
    'update',
    'updates',
    'this week',
    'announced',
    'announcement'
];

const currentEventVariations = [
    ['latest news'],
    ['breaking news'],
    ['today'],
    ['recent update'],
    ['news update'],
    ['announcement']
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

const getSearchSignature = (query) => query.trim().toLowerCase();

const isCurrentEventQuery = (query) => {
    const normalizedQuery = query.toLowerCase();
    return currentEventSignals.some(signal => normalizedQuery.includes(signal));
};

const getNextVariationTerms = (query) => {
    const signature = getSearchSignature(query);
    if (signature !== lastSearchSignature) {
        lastSearchSignature = signature;
        variationIndex = 0;
        recentlyShownVideoIds.clear();
    }

    const variationSet = isCurrentEventQuery(query) ? currentEventVariations : searchVariations;
    const terms = variationSet[variationIndex % variationSet.length];
    variationIndex += 1;
    return terms;
};

const buildTasteAwareQuery = (query, variationTerms = []) => {
    if (isCurrentEventQuery(query)) {
        return query;
    }

    const normalizedQuery = query.toLowerCase();
    const matchedProfile = tasteProfiles.find(profile =>
        profile.keywords.some(keyword => normalizedQuery.includes(keyword))
    );
    const profileTerms = matchedProfile ? matchedProfile.terms.slice(0, 3) : [];
    const terms = [...new Set([...profileTerms, ...variationTerms])];
    return `${query} ${terms.join(' ')}`;
};

const scoreVideo = (video, query) => {
    const haystack = `${video.title} ${video.description} ${video.channelTitle}`.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const queryWords = normalizedQuery
        .split(/\s+/)
        .map(word => word.replace(/[^a-z0-9]/g, ''))
        .filter(word => word.length > 2 && !['from', 'the', 'and', 'for', 'with'].includes(word));
    let score = 0;

    if (haystack.includes(normalizedQuery)) score += 6;
    queryWords.forEach(word => {
        if (haystack.includes(word)) score += 3;
    });

    if (isCurrentEventQuery(query)) {
        currentEventSignals.forEach(signal => {
            if (haystack.includes(signal)) score += 4;
        });
        if (haystack.includes('documentary') || haystack.includes('history')) score -= 6;
        return score;
    }

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
    const requiredWords = isCurrentEventQuery(query)
        ? query
            .toLowerCase()
            .split(/\s+/)
            .map(word => word.replace(/[^a-z0-9]/g, ''))
            .filter(word => word.length > 3 && !currentEventSignals.includes(word) && !['from', 'about', 'with'].includes(word))
        : [];

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
        .filter(video => {
            if (requiredWords.length === 0) return true;
            const haystack = `${video.title} ${video.description} ${video.channelTitle}`.toLowerCase();
            return requiredWords.some(word => haystack.includes(word));
        })
        .sort((a, b) => scoreVideo(b, query) - scoreVideo(a, query));
};

const rememberShownVideos = (videos) => {
    videos.forEach(video => recentlyShownVideoIds.add(video.id));
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
    const url = new URL('/.netlify/functions/youtube-search', window.location.origin);
    url.searchParams.set('q', query);
    if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `YouTube search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Unexpected YouTube API response.');
    }

    return data;
};

const searchYouTube = async (query, options = {}) => {
    const variationTerms = getNextVariationTerms(query);
    const pageToken = options.useNextPage ? searchPageToken : '';
    const tasteAwareData = await requestYouTubeSearch(buildTasteAwareQuery(query, variationTerms), pageToken);
    searchPageToken = tasteAwareData.nextPageToken || '';
    let tasteAwareVideos = prepareVideoResults(tasteAwareData.items, query)
        .filter(video => !recentlyShownVideoIds.has(video.id));

    if (tasteAwareVideos.length === 0) {
        tasteAwareVideos = prepareVideoResults(tasteAwareData.items, query);
    }

    if (tasteAwareVideos.length > 0) {
        replacementQueue = tasteAwareVideos.slice(10);
        const videos = tasteAwareVideos.slice(0, 10);
        rememberShownVideos(videos);
        return videos;
    }

    const fallbackData = await requestYouTubeSearch(query);
    searchPageToken = fallbackData.nextPageToken || '';
    let fallbackVideos = prepareVideoResults(fallbackData.items, query)
        .filter(video => !recentlyShownVideoIds.has(video.id));

    if (fallbackVideos.length === 0) {
        fallbackVideos = prepareVideoResults(fallbackData.items, query);
    }

    replacementQueue = fallbackVideos.slice(10);
    const videos = fallbackVideos.slice(0, 10);
    rememberShownVideos(videos);
    return videos;
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
        const data = await requestYouTubeSearch(buildTasteAwareQuery(lastQuery, getNextVariationTerms(lastQuery)), searchPageToken);
        searchPageToken = data.nextPageToken || '';
        const candidates = prepareVideoResults(data.items, lastQuery)
            .filter(video => !existingIds.has(video.id) && !recentlyShownVideoIds.has(video.id));

        if (candidates.length > 0) {
            replacementQueue = candidates.slice(1);
            rememberShownVideos([candidates[0]]);
            return candidates[0];
        }
    }

    return null;
};

const loadSearchResults = async (query, options = {}) => {
    if (!query) {
        showStatus('Please enter a search term.');
        return;
    }

    showStatus('Searching YouTube...');
    try {
        lastQuery = query;
        if (!options.useNextPage) {
            searchPageToken = '';
        }
        replacementQueue = [];
        currentVideos = await searchYouTube(query, options);
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
        rememberShownVideos([replacementVideo]);
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

    loadSearchResults(lastQuery, { useNextPage: true });
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

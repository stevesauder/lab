const videoList = document.getElementById('videoList');
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const aiBtn = document.getElementById('aiBtn');

// Categories of videos based on user preferences
const categories = {
    presence: [
        {id: 'hyvZ0XRAEcA', title: 'Eckhart Tolle: Presence and Awareness'},
        {id: 'sY0APKgHZRQ', title: 'Mindfulness, Stillness, and Everyday Life'},
        {id: '3qHkcs3YvK8', title: 'Naval Ravikant on Awareness and Happiness'},
        {id: 'nM3rTU927io', title: 'Alan Watts on Reality and Presence'}
    ],
    nature: [
        {id: 'PyFN_FYwqvc', title: 'Slow Forest Walk and Quiet Rain'},
        {id: 'e04zAMupq7E', title: 'Misty Mountain Morning'},
        {id: 'VNu15Qqomt8', title: 'Cinematic Misty Forest'},
        {id: 'RzVvThhjAKw', title: 'Pacific Northwest Visual Stillness'}
    ],
    photography: [
        {id: 'dcCFvBaPXY0', title: 'Analog Film Photography and Seeing'},
        {id: 'yd6zl5MZcl8', title: 'Composition, Light, and Visual Perception'},
        {id: 'f2WqMrAd598', title: 'Minimalist Photography: Finding the Frame'}
    ],
    thinking: [
        {id: '3lPnN8omdPA', title: 'Deep Thinking on AI, Creativity, and Meaning'},
        {id: 'UmzJIf3n9z4', title: 'Philosophy of Mind and Perception'},
        {id: '3qHkcs3YvK8', title: 'Systems, Attention, and Clear Thinking'}
    ],
    craft: [
        {id: '5vkd6SsYY70', title: 'Quiet Woodworking and Simple Craft'},
        {id: 'b0hNVT_5H0c', title: 'Thoughtful Handcraft and Material Practice'},
        {id: '7x5rf7YZsx8', title: 'Slow Building and Natural Materials'}
    ],
    music: [
        {id: 'YW5m4loqqm0', title: 'Ambient Sounds for Quiet Focus'},
        {id: 'DRFHklnN-SM', title: 'Minimalist Piano and Meditative Atmosphere'},
        {id: 'hTWKbfoikeg', title: 'Slow Piano and Stillness'}
    ]
};

// Pool of all videos for random selection
const videoPool = Object.values(categories).flat();

// Predefined AI suggested videos (mix of categories)
const aiVideos = [
    ...categories.presence.slice(0, 2),
    ...categories.nature.slice(0, 2),
    ...categories.photography.slice(0, 1),
    ...categories.thinking.slice(0, 2),
    ...categories.craft.slice(0, 1),
    ...categories.music.slice(0, 2)
];

let currentVideos = [...aiVideos];

// Function to render the list
function renderList(videos) {
    videoList.innerHTML = '';
    videos.forEach(video => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `https://www.youtube.com/watch?v=${video.id}`;
        a.target = '_blank';
        a.textContent = video.title;
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'refresh';
        refreshBtn.textContent = 'Refresh';
        refreshBtn.onclick = () => refreshVideo(video);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteVideo(video);
        li.appendChild(a);
        li.appendChild(refreshBtn);
        li.appendChild(deleteBtn);
        videoList.appendChild(li);
    });
}

// Initial render
renderList(currentVideos);

// Generate button
generateBtn.addEventListener('click', () => {
    const topic = topicInput.value.trim().toLowerCase();
    if (!topic) return;
    // Determine category based on topic
    let selectedCategory = videoPool; // default to all
    if (topic.includes('nature') || topic.includes('forest') || topic.includes('ocean') || topic.includes('mountain')) {
        selectedCategory = categories.nature;
    } else if (topic.includes('meditation') || topic.includes('mindfulness') || topic.includes('presence') || topic.includes('stillness')) {
        selectedCategory = categories.presence;
    } else if (topic.includes('photography') || topic.includes('photo') || topic.includes('film') || topic.includes('seeing')) {
        selectedCategory = categories.photography;
    } else if (topic.includes('thinking') || topic.includes('philosophy') || topic.includes('ai') || topic.includes('creativity') || topic.includes('mind')) {
        selectedCategory = categories.thinking;
    } else if (topic.includes('craft') || topic.includes('wood') || topic.includes('build') || topic.includes('material')) {
        selectedCategory = categories.craft;
    } else if (topic.includes('music') || topic.includes('ambient') || topic.includes('sound')) {
        selectedCategory = categories.music;
    }
    // Generate 10 videos based on selected category
    const generated = [];
    for (let i = 0; i < 10; i++) {
        const randomVideo = selectedCategory[Math.floor(Math.random() * selectedCategory.length)];
        generated.push({
            id: randomVideo.id,
            title: `${topicInput.value} - ${randomVideo.title}`
        });
    }
    currentVideos = generated;
    renderList(currentVideos);
});

// AI button
aiBtn.addEventListener('click', () => {
    currentVideos = [...aiVideos];
    renderList(currentVideos);
});

// Delete function
function deleteVideo(video) {
    const index = currentVideos.findIndex(v => v.id === video.id && v.title === video.title);
    if (index > -1) {
        currentVideos.splice(index, 1);
        // Add a new random video
        const randomVideo = videoPool[Math.floor(Math.random() * videoPool.length)];
        currentVideos.push({
            id: randomVideo.id,
            title: `New: ${randomVideo.title}`
        });
        renderList(currentVideos);
    }
}

// Refresh function
function refreshVideo(video) {
    const index = currentVideos.findIndex(v => v.id === video.id && v.title === video.title);
    if (index > -1) {
        const randomVideo = videoPool[Math.floor(Math.random() * videoPool.length)];
        currentVideos[index] = {
            id: randomVideo.id,
            title: `Refreshed: ${randomVideo.title}`
        };
        renderList(currentVideos);
    }
}
/**
 * Simple CMS - Admin Logic
 * Handles GitHub API integration and UI state.
 */

const GITHUB_API_BASE = 'https://api.github.com';
let posts = [];
let currentSha = ''; // To track file version for GitHub updates
let config = {
    owner: '',
    repo: '',
    branch: 'main',
    token: ''
};

// DOM Elements
const postListEl = document.getElementById('post-list');
const editorModal = document.getElementById('editor-modal');
const settingsModal = document.getElementById('settings-modal');
const postForm = document.getElementById('post-form');
const settingsForm = document.getElementById('settings-form');
const statusEl = document.getElementById('status-bar');
const statusMsg = document.getElementById('status-msg');

// Icon helpers (SVG)
const Icons = {
    edit: '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
    trash: '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>'
};

/**
 * Initialization
 */
function init() {
    loadConfig();

    if (!config.token || !config.repo) {
        showSettings();
    } else {
        fetchPosts();
    }

    // Event Listeners
    document.getElementById('btn-new-post').addEventListener('click', () => openEditor());
    document.getElementById('btn-settings').addEventListener('click', showSettings);
    document.getElementById('btn-close-editor').addEventListener('click', closeEditor);
    document.getElementById('btn-close-settings').addEventListener('click', closeSettings);

    postForm.addEventListener('submit', handlePostSave);
    settingsForm.addEventListener('submit', handleSettingsSave);
}

/**
 * Config / Auth
 */
function loadConfig() {
    const saved = localStorage.getItem('cms_config');
    if (saved) {
        config = JSON.parse(saved);
        // Pre-fill settings form
        document.getElementById('setting-owner').value = config.owner || '';
        document.getElementById('setting-repo').value = config.repo || '';
        document.getElementById('setting-branch').value = config.branch || 'main';
        document.getElementById('setting-token').value = config.token || '';
    }
}

function handleSettingsSave(e) {
    e.preventDefault();
    config.owner = document.getElementById('setting-owner').value.trim();
    config.repo = document.getElementById('setting-repo').value.trim();
    config.branch = document.getElementById('setting-branch').value.trim();
    config.token = document.getElementById('setting-token').value.trim();

    localStorage.setItem('cms_config', JSON.stringify(config));
    closeSettings();
    showToast('Settings saved. Reloading...');
    setTimeout(() => fetchPosts(), 1000);
}

/**
 * GitHub API Interaction
 */
async function fetchPosts() {
    showToast('Fetching posts from GitHub...', 'info');
    postListEl.innerHTML = '<div style="text-align:center; padding:2rem;">Loading...</div>';

    try {
        const path = 'posts.json'; // Can be configurable if needed
        const url = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet, we can Initialize it
                posts = [];
                currentSha = '';
                renderPosts();
                showToast('No posts.json found. Create a post to initialize.', 'warning');
                return;
            }
            throw new Error(`GitHub API Error: ${response.status}`);
        }

        const data = await response.json();
        currentSha = data.sha;

        // Content is base64 encoded
        // GitHub API may add newlines to base64 string, which breaks atob in browser
        const cleanContent = data.content.replace(/\n/g, '');
        const content = atob(cleanContent);
        // Decode unicode characters properly
        const jsonStr = decodeURIComponent(escape(content));
        posts = JSON.parse(jsonStr);

        renderPosts();
        showToast('Posts loaded successfully!', 'success');

    } catch (error) {
        console.error(error);
        postListEl.innerHTML = `<div style="text-align:center; color:var(--danger-color);">Error loading posts: ${error.message}</div>`;
        showToast('Error loading posts', 'error');
    }
}

async function savePostsToGitHub() {
    showToast('Syncing to GitHub...', 'info');

    try {
        const path = 'posts.json';
        const url = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;

        // Encode content
        const jsonStr = JSON.stringify(posts, null, 2);
        const contentEncoded = btoa(unescape(encodeURIComponent(jsonStr)));

        const body = {
            message: `Update posts [CMS]`,
            content: contentEncoded,
            branch: config.branch
        };

        if (currentSha) {
            body.sha = currentSha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Failed to save: ${errData.message || response.statusText}`);
        }

        const data = await response.json();
        currentSha = data.content.sha;
        showToast('Changes saved to GitHub!', 'success');

    } catch (error) {
        console.error(error);
        showToast(`Error saving: ${error.message}`, 'error');
    }
}

/**
 * UI Rendering
 */
function renderPosts() {
    postListEl.innerHTML = '';

    if (posts.length === 0) {
        postListEl.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-secondary);">No posts found. Create one!</div>';
        return;
    }

    // Sort by date desc
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            <div class="post-meta">${post.date}</div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <div style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem; flex-grow:1;">
                ${escapeHtml(post.summary || '')}
            </div>
            <div class="post-actions">
                <button class="btn" onclick="editPost('${post.id}')">
                    ${Icons.edit} Edit
                </button>
                <button class="btn" style="color:var(--danger-color); border-color:var(--danger-color);" onclick="deletePost('${post.id}')">
                    ${Icons.trash}
                </button>
            </div>
        `;
        postListEl.appendChild(card);
    });
}

/**
 * Editor Logic
 */
function openEditor(postId = null) {
    const form = document.getElementById('post-form');
    form.reset();

    if (postId) {
        const post = posts.find(p => p.id === postId);
        if (post) {
            document.getElementById('post-id').value = post.id;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-slug').value = post.slug;
            document.getElementById('post-date').value = post.date;
            document.getElementById('post-image').value = post.image || '';
            document.getElementById('post-summary').value = post.summary || '';
            document.getElementById('post-content').value = post.content || '';
            document.getElementById('post-tags').value = (post.tags || []).join(', ');
            document.getElementById('modal-title').innerText = 'Edit Post';
        }
    } else {
        document.getElementById('post-id').value = crypto.randomUUID();
        document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('modal-title').innerText = 'New Post';
    }

    editorModal.classList.add('open');
}

function handlePostSave(e) {
    e.preventDefault();

    const id = document.getElementById('post-id').value;
    const newPost = {
        id: id,
        title: document.getElementById('post-title').value,
        slug: document.getElementById('post-slug').value,
        date: document.getElementById('post-date').value,
        image: document.getElementById('post-image').value,
        summary: document.getElementById('post-summary').value,
        content: document.getElementById('post-content').value,
        tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    const existingIndex = posts.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
        posts[existingIndex] = newPost;
    } else {
        posts.push(newPost);
    }

    renderPosts();
    closeEditor();
    savePostsToGitHub();
}

/**
 * Actions
 */
window.editPost = function (id) {
    openEditor(id);
};

window.deletePost = function (id) {
    if (confirm('Are you sure you want to delete this post?')) {
        posts = posts.filter(p => p.id !== id);
        renderPosts();
        savePostsToGitHub();
    }
};

/* Modals */
function closeEditor() {
    editorModal.classList.remove('open');
}

function showSettings() {
    settingsModal.classList.add('open');
}

function closeSettings() {
    settingsModal.classList.remove('open');
}

/* Utilities */
function showToast(msg, type = 'info') {
    statusMsg.innerText = msg;
    statusEl.classList.add('show');

    // Auto hide after 3s
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Auto-generate slug from title
document.getElementById('post-title').addEventListener('input', (e) => {
    const id = document.getElementById('post-id').value;
    // Only auto-slug if it's a new post (not strictly checked here but good UX to not change existing slugs accidentally)
    // For now, simple logic: if slug is empty or matches previous title transformation
    const slugInput = document.getElementById('post-slug');
    if (document.activeElement !== slugInput) {
        slugInput.value = e.target.value
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
});

// Boot
init();

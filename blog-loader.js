/**
 * Simple CMS - Blog Loader
 * Usage: 
 *  - loadPosts(containerId) -> Renders list of posts
 *  - loadSinglePost(containerId, slug) -> Renders a single post
 */

const CMS_CONFIG = {
    postsUrl: 'https://raw.githubusercontent.com/bjbeier/CMS/main/posts.json'
};

/**
 * Fetch posts data
 */
async function fetchBlogPosts() {
    try {
        // Add cache-busting timestamp
        const urlWithCache = `${CMS_CONFIG.postsUrl}?t=${new Date().getTime()}`;
        const response = await fetch(urlWithCache);
        if (!response.ok) throw new Error('Failed to load posts');
        return await response.json();
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

/**
 * Render List of Posts
 * @param {string} containerId - DOM ID to inject content
 */
async function loadPosts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading posts...</div>';

    const posts = await fetchBlogPosts();

    if (posts.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }

    // Sort by date desc
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render HTML
    const html = posts.map(post => `
        <article class="blog-entry">
            ${post.image ? `<img src="${post.image}" alt="${post.title}" class="blog-image">` : ''}
            <div class="blog-content">
                <span class="blog-date">${formatDate(post.date)}</span>
                <h2 class="blog-title">
                    <a href="post.html?slug=${post.slug}">${post.title}</a>
                </h2>
                <p class="blog-summary">${post.summary}</p>
                <a href="post.html?slug=${post.slug}" class="read-more">Read Article &rarr;</a>
            </div>
        </article>
    `).join('');

    container.innerHTML = html;
}

/**
 * Render Single Post by Slug
 * @param {string} containerId 
 */
async function loadSinglePost(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get slug from URL
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        container.innerHTML = '<p>Post not found.</p>';
        return;
    }

    container.innerHTML = '<div class="loading">Loading article...</div>';

    const posts = await fetchBlogPosts();
    const post = posts.find(p => p.slug === slug);

    if (!post) {
        container.innerHTML = '<h1>404 - Post Not Found</h1><p><a href="index.html">Back to Blog</a></p>';
        document.title = 'Post Not Found';
        return;
    }

    // Update Page Title
    document.title = post.title;

    // Render
    const tagsHtml = (post.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join(' ');

    container.innerHTML = `
        <article class="single-post">
            <header class="post-header">
                <div class="post-meta-top">
                    <a href="index.html" class="back-link">&larr; Back to Blog</a>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <h1 class="post-title-main">${post.title}</h1>
                ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-hero-image">` : ''}
            </header>
            
            <div class="post-body">
                ${post.content}
            </div>

            <footer class="post-footer">
                <div class="tags">${tagsHtml}</div>
            </footer>
        </article>
    `;
}

/**
 * Helper: Format Date
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Auto-detect usage based on data attributes (optional convenience)
document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.querySelector('[data-blog-list]');
    if (listContainer) loadPosts(listContainer.id);

    const postContainer = document.querySelector('[data-blog-post]');
    if (postContainer) loadSinglePost(postContainer.id);
});

/**
 * Simple CMS - Blog Loader
 * Usage: 
 *  - loadPosts(containerId) -> Renders list of posts
 *  - loadSinglePost(containerId, slug) -> Renders a single post
 */

const CMS_CONFIG = {
    postsUrl: 'posts.json' // Path to posts.json relative to the usage, or absolute
};

/**
 * Fetch posts data
 */
async function fetchBlogPosts() {
    try {
        const response = await fetch(CMS_CONFIG.postsUrl);
        if (!response.ok) throw new Error('Failed to load posts');
        return await response.json();
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

/**
 * Render List of Posts (Tailwind / Glass Card Style)
 * @param {string} containerId - DOM ID to inject content
 */
async function loadPosts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="text-center text-slate-400 animate-pulse">Loading articles...</div>';

    const posts = await fetchBlogPosts();

    if (posts.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400">No articles found. Check back later!</div>';
        return;
    }

    // Sort by date desc
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render HTML
    const html = posts.map(post => {
        // Format tags
        const tagsHtml = (post.tags || []).map(t => `#${t}`).join(' ');

        return `
        <article class="glass-card p-8 rounded-2xl hover:border-brand-accent/30 transition-colors">
            <header class="mb-6">
                <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-mono mb-2">
                    <span class="text-brand-accent flex items-center">
                        <i data-lucide="calendar" class="w-4 h-4 mr-1"></i> ${formatDate(post.date)}
                    </span>
                    <span>${tagsHtml}</span>
                </div>
                <h2 class="text-2xl md:text-3xl font-bold text-white hover:text-brand-accent transition-colors">
                    <a href="BJB-post.html?slug=${post.slug}" class="block">${post.title}</a>
                </h2>
            </header>

            <div class="prose prose-invert max-w-none text-slate-300 leading-relaxed line-clamp-3">
                <p>${post.summary || ''}</p>
            </div>

            <div class="mt-6">
                <a href="BJB-post.html?slug=${post.slug}" class="inline-flex items-center text-brand-accent hover:underline font-medium group">
                    Read Full Article
                    <i data-lucide="arrow-right" class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                </a>
            </div>
        </article>
        `;
    }).join('');

    container.innerHTML = html;

    // Re-initialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Render Single Post by Slug (Tailwind Style)
 * @param {string} containerId 
 */
async function loadSinglePost(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get slug from URL
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        container.innerHTML = '<div class="text-center text-red-400">Article not specified.</div>';
        return;
    }

    container.innerHTML = '<div class="text-center text-slate-400 animate-pulse">Loading article...</div>';

    const posts = await fetchBlogPosts();
    const post = posts.find(p => p.slug === slug);

    if (!post) {
        container.innerHTML = `
            <div class="text-center py-20">
                <h1 class="text-4xl font-bold text-white mb-4">404</h1>
                <p class="text-slate-400 mb-8">Article not found.</p>
                <a href="BJB-blog.html" class="text-brand-accent hover:underline">Return to Blog</a>
            </div>
        `;
        document.title = 'Post Not Found | BJ Beier';
        return;
    }

    // Update Page Title
    document.title = `${post.title} | BJ Beier`;

    // Render
    const tagsHtml = (post.tags || []).map(t => `#${t}`).join(' ');

    container.innerHTML = `
        <article>
            <header class="mb-10 text-center">
                <div class="flex justify-center items-center gap-4 text-sm text-slate-500 font-mono mb-4">
                     <span class="text-brand-accent flex items-center">
                        <i data-lucide="calendar" class="w-4 h-4 mr-1"></i> ${formatDate(post.date)}
                    </span>
                    <span>${tagsHtml}</span>
                </div>
                <h1 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-8">
                    ${post.title}
                </h1>
                ${post.image ? `
                <div class="rounded-2xl overflow-hidden glass-card p-2 mb-10">
                    <img src="${post.image}" alt="${post.title}" class="w-full h-auto rounded-xl object-cover max-h-[500px]">
                </div>` : ''}
            </header>
            
            <div class="prose prose-lg prose-invert mx-auto text-slate-300 leading-relaxed">
                ${post.content}
            </div>

            <hr class="border-white/10 my-12">

            <div class="flex justify-center">
                <a href="BJB-blog.html" class="inline-flex items-center px-6 py-3 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
                    <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back to Articles
                </a>
            </div>
        </article>
    `;

    // Re-initialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
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

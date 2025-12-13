// Dynamic year
document.getElementById('year').textContent = new Date().getFullYear();

// Pagination settings
const POSTS_PER_PAGE = 5;
let currentPage = 1;
let allPosts = [];

// Load and display posts
async function loadPosts() {
    try {
        const response = await fetch('static/posts.json');
        const data = await response.json();
        allPosts = data.posts;
        displayPosts();
        setupPagination();
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('posts-container').innerHTML = '<p>Error loading posts.</p>';
    }
}

function displayPosts() {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const postsToShow = allPosts.slice(start, end);
    
    const container = document.getElementById('posts-container');
    
    if (postsToShow.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }
    
    container.innerHTML = postsToShow.map(post => `
        <article class="post-card">
            <a href="posts/${post.slug}.html">
                <h3>${post.title}</h3>
                <p class="meta">${formatDate(post.date)}</p>
                <p>${post.excerpt}</p>
            </a>
        </article>
    `).join('');
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function setupPagination() {
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">← Prev</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span>...</span>';
        }
    }
    
    // Next button
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next →</button>`;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    displayPosts();
    setupPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize
loadPosts();

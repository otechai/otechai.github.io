/**
 * devblog — app.js
 * Zero dependencies. Vanilla JS.
 * posts.json schema: { id, slug, title, date }
 * title defaults to slug until the user edits posts.json
 */

(function () {
  "use strict";

  // ── State ────────────────────────────────────────────────────────────────
  const state = {
    posts: [],
    filtered: [],
    query: "",
    page: 1,
    perPage: 5,
  };

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const postsContainer = $("posts-list");
  const pagination     = $("pagination");
  const searchInput    = $("search-input");
  const clearBtn       = $("clear-search");
  const searchCount    = $("search-count");
  const filterBar      = $("filter-bar");
  const noResults      = $("no-results");
  const recentListEl   = $("recent-list");

  // ── Fetch & init ─────────────────────────────────────────────────────────
  async function init() {
    try {
      const res = await fetch("posts.json");
      if (!res.ok) throw new Error("Could not load posts.json");
      const raw = await res.json();
      // Normalise: title defaults to slug
      state.posts = raw.map(p => ({
        ...p,
        title: p.title && p.title !== p.slug ? p.title : p.slug,
      }));
    } catch (e) {
      postsContainer.innerHTML =
        '<p style="color:var(--accent);font-style:italic;">Error loading posts. ' + e.message + "</p>";
      return;
    }

    state.posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    readURLState();
    buildRecentPosts();
    applyFilters();
    bindEvents();
  }

  // ── URL state ─────────────────────────────────────────────────────────────
  function readURLState() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("q"))    state.query   = params.get("q");
    if (params.get("page")) state.page    = parseInt(params.get("page"), 10) || 1;
    if (params.get("per"))  state.perPage = parseInt(params.get("per"),  10) || 5;
    if (searchInput) { searchInput.value = state.query; toggleClearBtn(); }
  }

  function pushURLState() {
    const params = new URLSearchParams();
    if (state.query)         params.set("q",    state.query);
    if (state.page > 1)      params.set("page", state.page);
    if (state.perPage !== 5) params.set("per",  state.perPage);
    const url = params.toString() ? "?" + params.toString() : window.location.pathname;
    history.replaceState(null, "", url);
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  function applyFilters() {
    const q = state.query.trim().toLowerCase();

    state.filtered = state.posts.filter(post => {
      if (!q) return true;
      const hay = [post.title, post.slug, post.date].join(" ").toLowerCase();
      return hay.includes(q);
    });

    const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
    if (state.page > maxPage) state.page = maxPage;

    renderPosts();
    renderPagination();
    updateSearchCount();
    pushURLState();
  }

  // ── Render posts ──────────────────────────────────────────────────────────
  function renderPosts() {
    const start = (state.page - 1) * state.perPage;
    const slice = state.filtered.slice(start, start + state.perPage);

    if (slice.length === 0) {
      postsContainer.innerHTML = "";
      noResults.classList.add("visible");
      return;
    }
    noResults.classList.remove("visible");

    const q = state.query.trim().toLowerCase();

    postsContainer.innerHTML = slice.map(post => {
      const title = highlight(escapeHtml(post.title), q);
      const date  = formatDate(post.date);

      return `
        <article class="post-card" id="post-${post.id}">
          <div class="post-meta">
            <span>${date}</span>
          </div>
          <h2 class="post-title">
            <a href="posts/${encodeURIComponent(post.slug)}.html">${title}</a>
          </h2>
          <div class="post-footer">
            <a class="read-more" href="posts/${encodeURIComponent(post.slug)}.html">Read &rarr;</a>
          </div>
        </article>
      `.trim();
    }).join("\n");

    postsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Render pagination ─────────────────────────────────────────────────────
  function renderPagination() {
    const total   = state.filtered.length;
    const perPage = state.perPage;
    const current = state.page;
    const maxPage = Math.max(1, Math.ceil(total / perPage));

    if (maxPage <= 1 && total <= perPage) { pagination.innerHTML = ""; return; }

    const pages = buildPageArray(current, maxPage);
    const prevDisabled = current <= 1     ? "disabled" : "";
    const nextDisabled = current >= maxPage ? "disabled" : "";

    const pageButtons = pages.map(p => {
      if (p === "…") return `<button class="page-btn ellipsis" disabled>…</button>`;
      return `<button class="page-btn ${p === current ? "current" : ""}" data-page="${p}">${p}</button>`;
    }).join("");

    const start = total === 0 ? 0 : (current - 1) * perPage + 1;
    const end   = Math.min(current * perPage, total);

    pagination.innerHTML = `
      <button class="page-btn" ${prevDisabled} data-page="${current - 1}">&laquo; Prev</button>
      ${pageButtons}
      <button class="page-btn" ${nextDisabled} data-page="${current + 1}">Next &raquo;</button>
      <span class="page-info">${total === 0 ? "0 posts" : `${start}–${end} of ${total}`}</span>
      <select class="per-page-select" title="Posts per page">
        ${[5,10,20].map(n => `<option value="${n}" ${n === perPage ? "selected" : ""}>${n} per page</option>`).join("")}
      </select>
    `;

    pagination.querySelectorAll(".page-btn[data-page]").forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener("click", () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= maxPage && p !== current) {
          state.page = p; applyFilters();
        }
      });
    });

    const perSel = pagination.querySelector(".per-page-select");
    if (perSel) {
      perSel.addEventListener("change", () => {
        state.perPage = parseInt(perSel.value, 10);
        state.page = 1;
        applyFilters();
      });
    }
  }

  function buildPageArray(current, max) {
    if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push("…");
    for (let p = Math.max(2, current - 1); p <= Math.min(max - 1, current + 1); p++) pages.push(p);
    if (current < max - 2) pages.push("…");
    pages.push(max);
    return pages;
  }

  // ── Sidebar recent posts ──────────────────────────────────────────────────
  function buildRecentPosts() {
    if (!recentListEl) return;
    recentListEl.innerHTML = state.posts.slice(0, 5).map(p =>
      `<li>
        <a href="posts/${encodeURIComponent(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="recent-date">${formatDate(p.date)}</span>
      </li>`
    ).join("");
  }

  // ── Search ────────────────────────────────────────────────────────────────
  function bindEvents() {
    if (searchInput) {
      searchInput.addEventListener("input", debounce(() => {
        state.query = searchInput.value;
        state.page = 1;
        toggleClearBtn();
        applyFilters();
      }, 220));
      searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") { state.query = searchInput.value; state.page = 1; toggleClearBtn(); applyFilters(); }
        if (e.key === "Escape") clearSearch();
      });
    }
    const searchBtn = $("search-btn");
    if (searchBtn) searchBtn.addEventListener("click", () => {
      state.query = searchInput.value; state.page = 1; toggleClearBtn(); applyFilters();
    });
    if (clearBtn) clearBtn.addEventListener("click", clearSearch);
  }

  function clearSearch() {
    state.query = ""; state.page = 1;
    if (searchInput) searchInput.value = "";
    toggleClearBtn(); applyFilters();
  }

  function toggleClearBtn() {
    if (!clearBtn) return;
    clearBtn.classList.toggle("visible", state.query.length > 0);
  }

  function updateSearchCount() {
    if (!searchCount) return;
    const total = state.filtered.length;
    const q = state.query.trim();
    searchCount.textContent = q
      ? `${total} result${total !== 1 ? "s" : ""} for "${q}"`
      : `${total} post${total !== 1 ? "s" : ""}`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function highlight(text, query) {
    if (!query) return text;
    const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${esc})`, "gi"), "<mark>$1</mark>");
  }

  function debounce(fn, delay) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
  }

  document.addEventListener("DOMContentLoaded", init);
})();

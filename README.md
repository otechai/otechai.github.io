# $_ Otmane Echaibi — Dev Blog

A fast, zero-dependency static blog for open source dev writing.
Old-school academic aesthetic. Monospace. No frameworks. No build tools.
Drop on any static host and it works.

Focus: Odoo internals · Firefox hacking · Linux kernel · open source culture · internet

GitHub: https://github.com/acidicroots
Email:  otmanova@proton.me

---

## File Structure

```
devblog/
├── index.html        ← Homepage (post list, search, pagination)
├── styles.css        ← All styles (palette, monospace, responsive)
├── app.js            ← Blog logic (search, filter, pagination, URL state)
├── posts.json        ← All post data — edit this to add/edit articles
├── new-post.py       ← Python CLI post generator
├── profile.jpg       ← Author photo (also used as favicon)
└── posts/
    └── *.html        ← Individual post files (do not auto-generate these)
```

---

## Adding Posts

### Interactive (recommended)

```bash
python new-post.py your topic here
```

The script:
1. Derives a slug from the title
2. Builds a Claude prompt and copies it to your clipboard
3. Pauses while you paste the prompt into Claude and copy the HTML back
4. Scaffolds `posts/<slug>.html` and appends the entry to `posts.json`
5. Opens nvim with both files side-by-side

### Examples

```bash
python new-post.py why odoo xml rpc is broken by design
python new-post.py "linux kernel module signing the hard way"
python new-post.py firefox devtools lies about network timing
python new-post.py the real cost of upstream kernel regressions
```

---

## posts.json fields

```json
{
  "id":          1,
  "slug":        "my-post",
  "title":       "Post Title",
  "subtitle":    "Optional subtitle",
  "date":        "2026-06-01",
  "author":      "Otmane Echaibi",
  "category":    "Odoo",
  "tags":        ["odoo", "python", "xml-rpc"],
  "excerpt":     "Short teaser shown on the listing page.",
  "readingTime": 7,
  "featured":    false,
  "content":     "Opening hook sentence — shown on index."
}
```

**tags**: keep them short and few — 2 to 4 per post, lowercase, no spaces.  
**categories**: Odoo, Firefox, Linux, Kernel, Open-Source, Internet, FOSS, Tools, CLI, Misc — or add your own.

---

## Seven-Slot Post Template

Each generated post has seven slots to fill in the HTML:

| Slot | Name         | Purpose                                                          |
|------|--------------|------------------------------------------------------------------|
| 1    | Hook         | One hard claim. Proves itself by the end.                        |
| 2    | Indictment   | Name what is broken, wrong, or misunderstood. No diplomacy.      |
| 3    | Evidence     | Code, logs, traces, git blame. Prove the claim.                  |
| 4    | Cost         | What this has actually cost. Real projects, real hours.          |
| 5    | Fix          | The working solution. Precise enough to apply today.             |
| 6    | Wider Truth  | Connection to open source, internet culture, software philosophy.|
| 7    | Exit         | A verdict. One sentence. Not a summary.                          |

---

## Writing Style

The prompt instructs Claude to write in a **brave, assertive, hawkish** style:

- State positions. Own them.
- Name the broken thing. Name who broke it.
- No hedging, no diplomatic nothing-statements.
- Precision over politeness.
- Real evidence — not "some people think."

---

## Features

- Live search (debounced, highlights matches)
- Smart pagination with URL state (`?q=odoo&page=2`)
- Bookmarkable / shareable URLs
- Zero JS frameworks, zero CSS frameworks
- Semantic HTML5 + aria attributes
- Full SEO meta (OG, Twitter Card, JSON-LD)
- Print stylesheet (sidebar/pagination hidden)

---

## Deployment

### GitHub Pages (free)

```bash
cd devblog
git init
git add .
git commit -m "init"
git remote add origin https://github.com/acidicroots/acidicroots.github.io.git
git push -u origin main
# Enable Pages in repo Settings → Pages → Source: main
```

Live at: `https://acidicroots.github.io`

### Any static host
Just upload all files. Works on Netlify, Cloudflare Pages, any Nginx/Apache box.

---

## Dependencies

| Tool        | Required for         |
|-------------|----------------------|
| Python 3.8+ | CLI generator        |
| stdlib only | No pip installs      |

Optional clipboard tools (any one): `wl-clipboard` (Wayland), `xclip` (X11), `pbcopy` (macOS).

---

## Adding Math Notation

For posts with math, two options:

**KaTeX (fast, recommended):**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body)"></script>
```
Use `$...$` inline, `$$...$$` display.

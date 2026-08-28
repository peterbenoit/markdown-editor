# Markdown Editor

Markdown Editor turns a browser tab into a focused writing, review, and publishing workspace. Write with live preview, catch structural problems before they ship, and export a branded document without sending the draft to a server.

[Open the live editor](https://md-fun.vercel.app) · [View the project page](https://peterbenoit.com/md-fun/) · [Read the roadmap](ROADMAP.md)

## What it does

### Write and preview

- Live editor, split, and preview modes
- GitHub Flavored Markdown, task lists, tables, footnotes, subscript, and superscript
- Syntax highlighting with language labels, line counts, and copy controls
- Mermaid diagrams rendered from fenced `mermaid` blocks
- YAML-style frontmatter display
- Emoji shortcodes, smart punctuation, and `==highlight==` markup
- Synchronized editor and preview scrolling
- Adjustable editor type size, resizable panes, and light/dark themes

### Check document quality

The document insights panel catches common publishing problems while you write:

- Missing or duplicate level-one headings
- Skipped heading levels
- Images without alternative text
- Vague link text and placeholder URLs
- Broken links to document sections
- Navigable document outline
- Line-by-line comparison with the latest saved snapshot
- Safe one-click fixes for supported issues

### Prepare company-ready output

The publishing studio adds presentation controls without changing the underlying Markdown:

- Organization name and accent color
- Optional generated table of contents
- Letter and A4 print layouts
- Technical brief, meeting notes, and decision record templates
- Standalone HTML download
- Browser print flow for PDF output

### Review locally

The workspace keeps multiple documents in the browser and adds a lightweight review workflow:

- Draft, in-review, and approved states
- Document duplication and guarded deletion
- Document-level or selected-text comments
- Portable read-only share links
- Recovery from stale or malformed saved workspace data

This is local-first collaboration, not a hosted team backend. Documents, comments, settings, and snapshots are stored in the current browser. There is no account system, SSO, server-side permission model, or cross-device synchronization.

## Privacy and sharing

The editor does not upload document content. Autosaved work stays in browser storage.

Read-only sharing works by encoding a copy of the document and its comments into the URL fragment after `#share=`. The fragment is not sent to the site server during a normal request, but the complete link still contains the document. Treat it like the document itself: do not paste it into public channels or third-party systems unless the content is safe to share there.

Portable share links support documents up to 50,000 characters. Changes made after copying a link do not update that shared copy.

## Run it locally

### Requirements

- Node.js 18 or newer
- npm

```bash
git clone https://github.com/peterbenoit/markdown-editor.git
cd markdown-editor
npm install
npm run dev
```

Vite prints the local URL when the server starts, usually [http://localhost:5173](http://localhost:5173).

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## How it is built

- React 18 and Vite 5
- `marked` plus focused extensions for Markdown parsing
- `highlight.js` for syntax highlighting
- Mermaid for diagrams, loaded only when a document needs it
- DOMPurify for rendered HTML and SVG sanitization
- Vitest, Testing Library, and jsdom for automated coverage
- Tailwind utilities plus project styles in `src/index.css`
- Vercel for production hosting

The main product surfaces are split into small modules:

| Area | Files |
| --- | --- |
| Editor and preview | `src/App.jsx` |
| Document outline, quality checks, and diffs | `src/DocumentInspector.jsx`, `src/markdownQuality.js` |
| Templates and export controls | `src/PublishingStudio.jsx`, `src/publishing.js` |
| Local documents, review states, comments, and sharing | `src/WorkspacePanel.jsx`, `src/workspace.js` |

## Test and release

Run the full local gate before publishing:

```bash
npm test
npm run build
```

The repository is linked to the `markdown-editor` Vercel project. A manual production release uses:

```bash
vercel deploy --prod --yes
```

Production is served at [md-fun.vercel.app](https://md-fun.vercel.app).

## Current boundaries

- Browser storage is device- and browser-specific. Clearing site data removes locally stored documents.
- Read-only links are snapshots. They do not create a live collaborative session.
- Real-time editing, centralized retention, role-based access, SSO, and audit logs require a backend and identity provider.
- Large Mermaid dependencies are code-split, but diagram-heavy sessions still download additional JavaScript.

## Contributing

Open an issue before making a large behavioral change. For focused fixes, fork the repository, add or update tests, and open a pull request with the problem and verification steps.

## License

MIT

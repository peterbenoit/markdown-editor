# Markdown Editor

A browser-based Markdown editor with real-time preview, syntax highlighting, and light/dark mode. Built with React and Vite.

## Features

- Real-time Markdown preview
- Light and dark mode toggle
- Text formatting toolbar (bold, italic, headers, links, code)
- Syntax highlighting via `highlight.js`
- Save content to a `.md` file or load an existing one

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- `npm`

### Installation

```bash
git clone https://github.com/peterbenoit/markdown-editor.git
cd markdown-editor
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

### Production Build

```bash
npm run build
```

Output goes to `dist/`.

## Usage

- Type Markdown in the left pane. The right pane renders it live.
- Select text, then use the toolbar buttons to apply formatting.
- Use the theme toggle to switch between light and dark mode.
- Save your content to a file or load an existing Markdown file using the toolbar controls.

## Customization

- Styles: `src/index.css`
- Syntax highlight theme: swap the `highlight.js` CSS import in `App.js`

## Contributing

Fork the repo and open a pull request. For significant changes, open an issue first.

## License

MIT

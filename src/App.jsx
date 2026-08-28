import React, { useState, useEffect, useMemo, useRef } from "react";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import markedSubSuper from "marked-subsuper-text";
import { gemoji } from "gemoji";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import {
  SunIcon,
  MoonIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  SaveIcon,
  ExportIcon,
  LoadIcon,
  TrashIcon,
  SnapshotIcon,
  TableCellsIcon,
  GitHubIcon,
  InsightsIcon,
  WorkspaceIcon,
} from "./icons.jsx";
import DocumentInspector from "./DocumentInspector.jsx";
import { analyzeMarkdown, getDocumentOutline, getLineDiff } from "./markdownQuality.js";
import PublishingStudio from "./PublishingStudio.jsx";
import { buildTableOfContentsHtml, getPublishingTemplate } from "./publishing.js";
import WorkspacePanel from "./WorkspacePanel.jsx";
import { createShareHash, deriveDocumentTitle, makeWorkspaceDocument, normalizeWorkspaceDocuments, parseShareHash } from "./workspace.js";
import "./index.css";

const LANGUAGE_ALIASES = {
  html: "xml",
  shell: "bash",
  sh: "bash",
  yml: "yaml",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
};

const LANGUAGE_LABELS = {
  bash: "Shell",
  css: "CSS",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  python: "Python",
  sql: "SQL",
  text: "Plain text",
  typescript: "TypeScript",
  xml: "HTML / XML",
  yaml: "YAML",
};

const AUTO_DETECT_LANGUAGES = [
  "bash", "css", "javascript", "json", "markdown", "python", "sql", "typescript", "xml", "yaml",
];

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const getHighlightedCode = (text, languageHint = "") => {
  const requested = languageHint.trim().split(/\s+/)[0].toLowerCase();
  const language = LANGUAGE_ALIASES[requested] || requested;

  if (language && hljs.getLanguage(language)) {
    return {
      html: hljs.highlight(text, { language }).value,
      language,
      label: LANGUAGE_LABELS[language] || requested.toUpperCase(),
    };
  }

  // Auto-detect only code-like, multi-line content so prose remains plain text.
  if (!requested && text.includes("\n") && /[{}()[\];:=<>]|\b(const|let|function|class|def|SELECT|FROM)\b/.test(text)) {
    const detected = hljs.highlightAuto(text, AUTO_DETECT_LANGUAGES);
    if (detected.language && detected.relevance >= 2) {
      return {
        html: detected.value,
        language: detected.language,
        label: `${LANGUAGE_LABELS[detected.language] || detected.language.toUpperCase()} · detected`,
      };
    }
  }

  return { html: escapeHtml(text), language: "text", label: requested ? `${requested} · plain text` : "Plain text" };
};

const STARTER = `# Markdown Editor

Type on the left, see the result on the right.

---

**Bold**, _italic_, and ~~strikethrough~~ work out of the box, along with [links](https://example.com) and \`inline code\`.

## A few things to try

\`\`\`js
// Fenced code blocks get syntax highlighting
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

- [x] Task lists
- [ ] Are supported too

> Clear this document to start writing.
`;

function loadInitialWorkspace() {
  const sharedDocument = parseShareHash(window.location.hash);
  if (sharedDocument) {
    return { activeDocumentId: null, documents: [], isSharedView: true, markdown: sharedDocument.content, sharedDocument };
  }

  try {
    const savedDocuments = normalizeWorkspaceDocuments(JSON.parse(localStorage.getItem("md-documents") || "[]"));
    if (savedDocuments.length > 0) {
      const savedActiveId = localStorage.getItem("md-active-document");
      const activeDocument = savedDocuments.find((document) => document.id === savedActiveId) || savedDocuments[0];
      return { activeDocumentId: activeDocument.id, documents: savedDocuments, isSharedView: false, markdown: activeDocument.content };
    }
  } catch { /* Fall back to the legacy single-document draft. */ }

  const initialDocument = makeWorkspaceDocument(localStorage.getItem("markdown") ?? STARTER);
  return { activeDocumentId: initialDocument.id, documents: [initialDocument], isSharedView: false, markdown: initialDocument.content };
}

const EMOJI_MAP = Object.fromEntries(
  gemoji.flatMap((e) => e.names.map((n) => [n, e.emoji]))
);

marked.use({
  gfm: true,
  renderer: {
    heading({ text, depth }) {
      const slug = text
        .replace(/<[^>]+>/g, "")
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      return `<h${depth} id="${slug}">${text}</h${depth}>\n`;
    },
    tablecell({ text, header, align }) {
      const tag = header ? "th" : "td";
      const cls = align ? ` class="align-${align}"` : "";
      return `<${tag}${cls}>${text}</${tag}>\n`;
    },
    code({ text, lang }) {
      if ((lang || "").trim().toLowerCase() === "mermaid") {
        return `<figure class="mermaid-card"><figcaption><span class="code-status-dot" aria-hidden="true"></span>Diagram</figcaption><div class="mermaid-diagram" role="img" aria-label="Mermaid diagram" data-mermaid-source="${encodeURIComponent(text)}"><pre class="mermaid-source-fallback">${escapeHtml(text)}</pre></div></figure>`;
      }
      const highlighted = getHighlightedCode(text, lang || "");
      const lineCount = text.split("\n").length;
      return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang-label"><span class="code-status-dot" aria-hidden="true"></span>${highlighted.label}</span><span class="code-block-actions"><span class="code-line-count">${lineCount} ${lineCount === 1 ? "line" : "lines"}</span><button class="code-copy-btn" type="button" aria-label="Copy code to clipboard">Copy</button></span></div><pre><code class="hljs language-${highlighted.language}">${highlighted.html}</code></pre></div>`;
    },
    listitem(token) {
      // parseInline can't handle block-level tokens (nested lists, paragraphs, etc.)
      // Route block tokens through parse(), inline tokens through parseInline()
      const BLOCK_TYPES = new Set(['list', 'paragraph', 'blockquote', 'code', 'html', 'heading', 'table', 'hr', 'space']);
      let text = '';
      let inlineBuf = [];

      const flushInline = () => {
        if (inlineBuf.length) {
          text += this.parser.parseInline(inlineBuf);
          inlineBuf = [];
        }
      };

      for (const t of token.tokens) {
        if (BLOCK_TYPES.has(t.type)) {
          flushInline();
          if (t.type !== 'space') text += this.parser.parse([t]);
        } else {
          inlineBuf.push(t);
        }
      }
      flushInline();

      if (token.task) {
        const box = token.checked
          ? `<input type="checkbox" checked disabled class="task-checkbox"> `
          : `<input type="checkbox" disabled class="task-checkbox"> `;
        return `<li class="task-list-item">${box}${text}</li>\n`;
      }
      return `<li>${text}</li>\n`;
    },
  },
});

marked.use(markedFootnote());
marked.use(markedSubSuper());

function parseFrontmatter(text) {
  const match = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!match) return { meta: null, body: text };
  const raw = match[1];
  const meta = {};
  for (const line of raw.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (key) meta[key] = value;
  }
  // If no valid key: value pairs were found, it's not frontmatter — pass through as-is
  if (Object.keys(meta).length === 0) return { meta: null, body: text };
  return { meta, body: text.slice(match[0].length) };
}

function App() {
  const [initialWorkspace] = useState(loadInitialWorkspace);
  const [markdown, setMarkdown] = useState(initialWorkspace.markdown);
  const [documents, setDocuments] = useState(initialWorkspace.documents);
  const [activeDocumentId, setActiveDocumentId] = useState(initialWorkspace.activeDocumentId);
  const isSharedView = initialWorkspace.isSharedView;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [viewMode, setViewMode] = useState(isSharedView ? "preview" : "split"); // 'editor' | 'split' | 'preview'
  const [isStriped, setIsStriped] = useState(true);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [fontSize, setFontSize] = useState(14); // px
  const FONT_SIZES = [11, 12, 13, 14, 16, 18, 20];
  const [storageWarning, setStorageWarning] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [confirmClear, setConfirmClear] = useState(false);
  const [versions, setVersions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("md-versions") || "[]"); }
    catch { return []; }
  });
  const [showVersions, setShowVersions] = useState(false);
  const MAX_VERSIONS = 5;
  const [splitRatio, setSplitRatio] = useState(() => {
    const saved = Number(localStorage.getItem("md-split-ratio"));
    return saved >= 20 && saved <= 80 ? saved : 50;
  });
  const [isDragging, setIsDragging] = useState(false);
  const paneContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const syncingRef = useRef(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const announceTimerRef = useRef(null);
  const toolbarRef = useRef(null);
  const [toolbarFocusIdx, setToolbarFocusIdx] = useState(0);
  const versionsRef = useRef(null);
  const insightsTriggerRef = useRef(null);
  const [showInsights, setShowInsights] = useState(false);
  const [insightsTab, setInsightsTab] = useState("quality");
  const publishingTriggerRef = useRef(null);
  const [showPublishing, setShowPublishing] = useState(false);
  const workspaceTriggerRef = useRef(null);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [publishingSettings, setPublishingSettings] = useState(() => {
    const defaults = { organization: "", accent: "#4f46e5", includeToc: true, paperSize: "letter" };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem("md-publishing-settings") || "{}") }; }
    catch { return defaults; }
  });

  useEffect(() => {
    if (!showVersions) return;
    const handler = (e) => {
      if (versionsRef.current && !versionsRef.current.contains(e.target)) {
        setShowVersions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVersions]);

  useEffect(() => {
    if (isSharedView) {
      setSaveStatus("shared");
      return undefined;
    }
    setSaveStatus("saving");
    let statusTimer;
    try {
      localStorage.setItem("markdown", markdown);
      // Warn if stored content exceeds 4MB (leaving buffer before ~5MB browser cap)
      const bytes = new Blob([markdown]).size;
      setStorageWarning(bytes > 4 * 1024 * 1024);
      statusTimer = setTimeout(() => setSaveStatus("saved"), 350);
    } catch {
      setStorageWarning(true);
      setSaveStatus("error");
    }
    return () => clearTimeout(statusTimer);
  }, [markdown, isSharedView]);

  useEffect(() => {
    if (isSharedView || !activeDocumentId) return;
    setDocuments((currentDocuments) => currentDocuments.map((document) => (
      document.id === activeDocumentId
        ? { ...document, content: markdown, title: deriveDocumentTitle(markdown), updatedAt: Date.now() }
        : document
    )));
  }, [markdown, activeDocumentId, isSharedView]);

  useEffect(() => {
    if (isSharedView || documents.length === 0) return;
    localStorage.setItem("md-documents", JSON.stringify(documents));
    localStorage.setItem("md-active-document", activeDocumentId || documents[0].id);
  }, [documents, activeDocumentId, isSharedView]);

  useEffect(() => {
    localStorage.setItem("md-publishing-settings", JSON.stringify(publishingSettings));
  }, [publishingSettings]);

  const formatSelectedText = (before, after = "") => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.slice(start, end);
    if (!selectedText) return;

    const leadingSpaces = selectedText.match(/^\s*/)[0];
    const trailingSpaces = selectedText.match(/\s*$/)[0];
    const trimmedText = selectedText.trim();

    const isWrapped =
      trimmedText.startsWith(before) && trimmedText.endsWith(after);

    let newText, newStart, newEnd;
    if (isWrapped) {
      const unwrapped = trimmedText.slice(before.length, trimmedText.length - after.length);
      newText =
        markdown.slice(0, start) +
        leadingSpaces +
        unwrapped +
        trailingSpaces +
        markdown.slice(end);
      newStart = start + leadingSpaces.length;
      newEnd = newStart + unwrapped.length;
    } else {
      newText =
        markdown.slice(0, start) +
        leadingSpaces +
        before +
        trimmedText +
        after +
        trailingSpaces +
        markdown.slice(end);
      newStart = start + leadingSpaces.length + before.length;
      newEnd = newStart + trimmedText.length;
    }

    setMarkdown(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setMarkdown(markdown.slice(0, start) + "  " + markdown.slice(end));
      requestAnimationFrame(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      });
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b") { e.preventDefault(); formatSelectedText("**", "**"); }
      else if (e.key === "i") { e.preventDefault(); formatSelectedText("_", "_"); }
      else if (e.key === "k") { e.preventDefault(); formatSelectedText("[", "](url)"); }
      return;
    }

    const AUTO_PAIRS = { "[": "]", "(": ")", "{": "}", '"': '"', "`": "`" };
    const closer = AUTO_PAIRS[e.key];
    if (closer) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) {
        e.preventDefault();
        const selectedText = markdown.slice(start, end);
        setMarkdown(markdown.slice(0, start) + e.key + selectedText + closer + markdown.slice(end));
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
        });
        return;
      }

      // Quotes/backticks toggle as a pair only when not already inside a word
      const isSymmetric = e.key === closer;
      if (!isSymmetric || !/\w/.test(markdown[start - 1] || "")) {
        e.preventDefault();
        setMarkdown(markdown.slice(0, start) + e.key + closer + markdown.slice(end));
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 1, start + 1);
        });
        return;
      }
    }

    // Typing a closing character right before an auto-inserted match just skips over it
    if (Object.values(AUTO_PAIRS).includes(e.key)) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end && markdown[start] === e.key) {
        e.preventDefault();
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 1, start + 1);
        });
      }
    }
  };

  const updateCursor = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const before = textarea.value.slice(0, pos);
    const line = before.split("\n").length;
    const col = pos - before.lastIndexOf("\n");
    setCursor({ line, col });
  };

  const checkTextSelection = () => {
    const textarea = textareaRef.current;
    setIsTextSelected(textarea.selectionStart !== textarea.selectionEnd);
    updateCursor();
  };

  const handleChange = (e) => {
    setMarkdown(e.target.value);
    checkTextSelection();
  };

  const saveToFile = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "markdown.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToHtml = () => {
    const title = meta?.title || "Exported Document";
    const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { --accent: ${publishingSettings.accent}; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 780px; margin: 3rem auto; padding: 0 1.5rem; line-height: 1.7; color: #172033; }
  h1,h2,h3,h4,h5,h6 { margin: 1.4em 0 0.55em; font-weight: 700; line-height: 1.2; letter-spacing: -.02em; }
  h1 { font-size: 2.25em; padding-bottom: .35em; border-bottom: 1px solid #dce2ea; } h2 { font-size: 1.55em; } h3 { font-size: 1.25em; }
  code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace; }
  :not(pre) > code { background: #eef2ff; color: #4338ca; padding: .18em .4em; border: 1px solid #dfe3ff; border-radius: 5px; font-size: .875em; }
  .code-block-wrapper { margin: 1.5em 0; overflow: hidden; border: 1px solid #25334d; border-radius: 10px; background: #101827; box-shadow: 0 10px 30px rgba(15,23,42,.12); }
  .code-block-header { display: flex; align-items: center; justify-content: space-between; padding: .55rem .8rem; border-bottom: 1px solid #25334d; background: #172033; color: #a7b2c7; font: 600 .7rem/1.2 Inter, sans-serif; letter-spacing: .055em; text-transform: uppercase; }
  .code-lang-label, .code-block-actions { display: flex; align-items: center; gap: .55rem; } .code-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #5eead4; box-shadow: 0 0 0 3px rgba(94,234,212,.12); }
  .code-line-count, .code-copy-btn { display: none; } .code-block-wrapper pre { margin: 0; padding: 1.1rem 1.2rem; overflow-x: auto; background: #101827; color: #d9e2f2; font-size: .875rem; line-height: 1.65; tab-size: 2; }
  .hljs-comment,.hljs-quote { color:#8290a8; font-style:italic } .hljs-keyword,.hljs-selector-tag,.hljs-literal,.hljs-section { color:#c4b5fd } .hljs-string,.hljs-attr,.hljs-addition { color:#86efac } .hljs-number,.hljs-symbol,.hljs-bullet { color:#fbbf24 } .hljs-title,.hljs-title.class_,.hljs-title.function_ { color:#7dd3fc } .hljs-variable,.hljs-template-variable,.hljs-selector-class { color:#fda4af } .hljs-built_in,.hljs-type,.hljs-meta { color:#67e8f9 } .hljs-deletion { color:#fca5a5 }
  blockquote { margin: 1em 0; padding: 0.5em 1em; border-left: 4px solid #d1d5db; color: #6b7280; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 1em 0; }
  th, td { padding: 0.5em 0.75em; border: 1px solid #d1d5db; }
  th { background: #f3f4f6; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  a { color: var(--accent); }
  hr { border: none; border-top: 1px solid #d1d5db; margin: 1.5em 0; }
  .document-brand { margin-bottom: 2rem; color: var(--accent); font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .document-toc { margin: 1.5rem 0 2rem; padding: 1rem 1.25rem; border-left: 3px solid var(--accent); background: #f8fafc; } .document-toc h2 { margin-top: 0; font-size: 1rem; } .document-toc ol { margin-bottom: 0; padding-left: 1.25rem; } .document-toc li { margin: .25rem 0; } .document-toc .toc-depth-2 { margin-left: 1rem; } .document-toc .toc-depth-3 { margin-left: 2rem; }
</style>
</head>
<body>
${publishingSettings.organization ? `<div class="document-brand">${publishingSettings.organization.replace(/[<>&]/g, "")}</div>` : ""}
${publishingSettings.includeToc ? buildTableOfContentsHtml(documentOutline) : ""}
${html}
</body>
</html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveVersion = () => {
    if (!markdown) return;
    const snap = {
      id: Date.now(),
      ts: new Date().toLocaleString(),
      preview: markdown.slice(0, 60).replace(/\n/g, " "),
      content: markdown,
    };
    const next = [snap, ...versions].slice(0, MAX_VERSIONS);
    setVersions(next);
    try { localStorage.setItem("md-versions", JSON.stringify(next)); } catch { /* quota */ }
  };

  const loadVersion = (v) => {
    setMarkdown(v.content);
    setShowVersions(false);
  };

  const deleteVersion = (id) => {
    const next = versions.filter(v => v.id !== id);
    setVersions(next);
    localStorage.setItem("md-versions", JSON.stringify(next));
  };

  const clearEditor = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setMarkdown("");
    setConfirmClear(false);
    textareaRef.current?.focus();
  };

  const loadFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMarkdown(ev.target.result);
    reader.readAsText(file);
    e.target.value = "";
  };

  const getPlainText = (md) =>
    md
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/\`([^\`]*)\`/g, "$1")
      .replace(/\`\`\`[\s\S]*?\`\`\`/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[\r\n]/gm, "");

  const handleCopyClick = (e) => {
    const btn = e.target.closest(".code-copy-btn");
    if (!btn) return;
    const code = btn.closest(".code-block-wrapper")?.querySelector("code");
    if (!code) return;
    navigator.clipboard.writeText(code.textContent).then(() => {
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = "Copy"; }, 2000);
    }).catch(() => {
      btn.textContent = "Error";
      setTimeout(() => { btn.textContent = "Copy"; }, 2000);
    });
  };

  const handleEditorScroll = () => {
    if (syncingRef.current) return;
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    syncingRef.current = true;
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    requestAnimationFrame(() => { syncingRef.current = false; });
  };

  const handlePreviewScroll = () => {
    if (syncingRef.current) return;
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    syncingRef.current = true;
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    requestAnimationFrame(() => { syncingRef.current = false; });
  };

  const clampRatio = (r) => Math.min(80, Math.max(20, r));

  const handleDividerPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.focus();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const container = paneContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const ratio = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(clampRatio(ratio));
    };
    const handleUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    localStorage.setItem("md-split-ratio", String(splitRatio));
  }, [splitRatio]);

  const handleDividerKeyDown = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setSplitRatio((r) => clampRatio(r - 2)); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setSplitRatio((r) => clampRatio(r + 2)); }
    else if (e.key === "Home") { e.preventDefault(); setSplitRatio(20); }
    else if (e.key === "End") { e.preventDefault(); setSplitRatio(80); }
  };

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = getPlainText(markdown).length;
  const documentOutline = useMemo(() => getDocumentOutline(markdown), [markdown]);
  const diagnostics = useMemo(() => analyzeMarkdown(markdown), [markdown]);
  const latestSnapshot = versions[0] || null;
  const snapshotDiff = useMemo(
    () => latestSnapshot ? getLineDiff(markdown, latestSnapshot.content) : [],
    [latestSnapshot, markdown]
  );
  const tableOfContentsHtml = useMemo(
    () => publishingSettings.includeToc ? buildTableOfContentsHtml(documentOutline) : "",
    [publishingSettings.includeToc, documentOutline]
  );

  const closeInsights = () => {
    setShowInsights(false);
    requestAnimationFrame(() => insightsTriggerRef.current?.focus());
  };

  const jumpToOffset = (offset) => {
    setViewMode("editor");
    setShowInsights(false);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      textarea?.focus();
      textarea?.setSelectionRange(offset, offset);
      updateCursor();
    });
  };

  const applyDiagnosticFix = (fix) => {
    const nextMarkdown = markdown.slice(0, fix.start) + fix.text + markdown.slice(fix.end);
    setMarkdown(nextMarkdown);
    setViewMode("editor");
    setShowInsights(false);
    requestAnimationFrame(() => {
      const focusStart = fix.start + fix.text.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(focusStart, focusStart);
    });
  };

  const closePublishing = () => {
    setShowPublishing(false);
    requestAnimationFrame(() => publishingTriggerRef.current?.focus());
  };

  const activeDocument = documents.find((document) => document.id === activeDocumentId) || null;

  const closeWorkspace = () => {
    setShowWorkspace(false);
    requestAnimationFrame(() => workspaceTriggerRef.current?.focus());
  };

  const selectWorkspaceDocument = (documentId) => {
    const nextDocument = documents.find((document) => document.id === documentId);
    if (!nextDocument) return;
    setActiveDocumentId(documentId);
    setMarkdown(nextDocument.content);
    setShowWorkspace(false);
    setViewMode("split");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const createWorkspaceDocument = () => {
    const nextDocument = makeWorkspaceDocument();
    setDocuments((currentDocuments) => [...currentDocuments, nextDocument]);
    setActiveDocumentId(nextDocument.id);
    setMarkdown(nextDocument.content);
    setShowWorkspace(false);
    setViewMode("split");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const duplicateWorkspaceDocument = () => {
    if (!activeDocument) return;
    const duplicateTitle = `${deriveDocumentTitle(activeDocument.content)} copy`;
    const duplicateContent = /^#\s+.+?\s*#*\s*$/m.test(activeDocument.content)
      ? activeDocument.content.replace(/^#\s+.+?\s*#*\s*$/m, `# ${duplicateTitle}`)
      : `# ${duplicateTitle}\n\n${activeDocument.content}`;
    const duplicate = {
      ...activeDocument,
      id: crypto.randomUUID(),
      title: duplicateTitle,
      content: duplicateContent,
      comments: activeDocument.comments.map((comment) => ({ ...comment, id: crypto.randomUUID() })),
      updatedAt: Date.now(),
    };
    setDocuments((currentDocuments) => [...currentDocuments, duplicate]);
    setActiveDocumentId(duplicate.id);
    setMarkdown(duplicateContent);
  };

  const deleteWorkspaceDocument = () => {
    if (!activeDocument || documents.length <= 1) return;
    const remainingDocuments = documents.filter((document) => document.id !== activeDocument.id);
    setDocuments(remainingDocuments);
    setActiveDocumentId(remainingDocuments[0].id);
    setMarkdown(remainingDocuments[0].content);
  };

  const updateWorkspaceDocument = (updates) => {
    if (!activeDocumentId) return;
    setDocuments((currentDocuments) => currentDocuments.map((document) => (
      document.id === activeDocumentId ? { ...document, ...updates, updatedAt: Date.now() } : document
    )));
  };

  const addWorkspaceComment = (text, author) => {
    if (!activeDocument) return;
    const textarea = textareaRef.current;
    const quote = isTextSelected && textarea
      ? markdown.slice(textarea.selectionStart, textarea.selectionEnd)
      : "";
    updateWorkspaceDocument({
      comments: [...activeDocument.comments, { id: crypto.randomUUID(), author, text, quote, createdAt: Date.now() }],
    });
  };

  const shareWorkspaceDocument = async () => {
    if (!activeDocument) return;
    const shareHash = createShareHash({ ...activeDocument, content: markdown, title: deriveDocumentTitle(markdown) });
    await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}${shareHash}`);
  };

  const handlePrint = () => {
    setShowPublishing(false);
    setViewMode("preview");
    document.documentElement.dataset.paperSize = publishingSettings.paperSize;
    requestAnimationFrame(() => window.print());
  };

  const usePublishingTemplate = (templateId) => {
    setMarkdown(getPublishingTemplate(templateId, publishingSettings.organization));
    setShowPublishing(false);
    setViewMode("split");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  useEffect(() => {
    clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => {
      setLiveAnnouncement(`${wordCount} words, ${charCount} characters`);
    }, 1500);
    return () => clearTimeout(announceTimerRef.current);
  }, [wordCount, charCount]);
  const { meta, body } = parseFrontmatter(markdown);

  const applyTypography = (rawHtml) => {
    const template = document.createElement("template");
    template.innerHTML = rawHtml;

    const transformText = (text) =>
      text
        .replace(/\.\.\./g, "\u2026")
        .replace(/---/g, "\u2014")
        .replace(/--/g, "\u2013")
        .replace(/\(c\)/gi, "\u00a9")
        .replace(/\(r\)/gi, "\u00ae")
        .replace(/\(tm\)/gi, "\u2122")
        .replace(/(\s|^)"(\S)/g, "$1\u201c$2")
        .replace(/(\S)"(\s|$)/g, "$1\u201d$2")
        .replace(/(\s|^)'(\S)/g, "$1\u2018$2")
        .replace(/(\S)'(\s|$)/g, "$1\u2019$2")
        .replace(/:([a-z0-9_+\-]+):/g, (match, code) => EMOJI_MAP[code] ?? match)
        // Emoticons — require whitespace (or start/end) on both sides
        // Note: marked encodes > as &gt; and < as &lt; in paragraph text
        .replace(/(^|\s)(&gt;:\)|&gt;:-\))(?=\s|$)/g, "$1😈")
        .replace(/(^|\s)(&gt;:\(|&gt;:-\()(?=\s|$)/g, "$1😠")
        .replace(/(^|\s)(:\)|:-\)|=\))(?=\s|$)/g, "$1😊")
        .replace(/(^|\s)(:\(|:-\(|=\()(?=\s|$)/g, "$1😞")
        .replace(/(^|\s)(:D|:-D|=D)(?=\s|$)/g, "$1😄")
        .replace(/(^|\s)(:P|:-P|=P)(?=\s|$)/g, "$1😛")
        .replace(/(^|\s)(;\)|;-\))(?=\s|$)/g, "$1😉")
        .replace(/(^|\s)(:\'\(|:'\(|:'-\()(?=\s|$)/g, "$1😢")
        .replace(/(^|\s)(:\||:-\|)(?=\s|$)/g, "$1😐")
        .replace(/(^|\s)(:o|:-o|:O|:-O)(?=\s|$)/g, "$1😮")
        .replace(/(^|\s)(&lt;3)(?=\s|$)/g, "$1❤️")
        .replace(/(^|\s)(&lt;\/3)(?=\s|$)/g, "$1💔");

    const nodeFilter = document.defaultView.NodeFilter;
    const walker = document.createTreeWalker(
      template.content,
      nodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          return parent?.closest("code, pre")
            ? nodeFilter.FILTER_REJECT
            : nodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      node.nodeValue = transformText(node.nodeValue);
    });

    return template.innerHTML;
  };

  const highlightedBody = body.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
  const html = DOMPurify.sanitize(applyTypography(marked.parse(highlightedBody)), {
    ADD_TAGS: ["button", "mark", "sub", "sup", "section"],
    ADD_ATTR: ["id", "data-footnote-ref", "data-footnotes", "data-footnote-backref", "data-mermaid-source", "aria-describedby", "aria-label", "type"],
  });

  useEffect(() => {
    const diagrams = Array.from(previewRef.current?.querySelectorAll(".mermaid-diagram") || []);
    if (!diagrams.length) return undefined;
    let cancelled = false;

    const renderDiagrams = async () => {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: isDarkMode ? "dark" : "neutral",
        htmlLabels: false,
        flowchart: { htmlLabels: false },
      });

      for (const [index, element] of diagrams.entries()) {
        if (cancelled) return;
        try {
          const source = decodeURIComponent(element.dataset.mermaidSource || "");
          const { svg } = await mermaid.render(`mermaid-${Date.now()}-${index}`, source);
          if (cancelled) return;
          element.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
          element.classList.add("is-rendered");
        } catch {
          element.classList.add("has-error");
          element.innerHTML = '<p class="mermaid-error">This diagram could not be rendered. Check the Mermaid syntax.</p>';
        }
      }
    };

    renderDiagrams();
    return () => { cancelled = true; };
  }, [html, isDarkMode, viewMode]);

  const btnTheme = isDarkMode
    ? "bg-gray-600 text-gray-100 hover:bg-gray-500"
    : "bg-gray-200 text-gray-800 hover:bg-gray-300";

  const iconButtons = [
    { icon: BoldIcon, title: "Bold", handler: () => formatSelectedText("**", "**") },
    { icon: ItalicIcon, title: "Italic", handler: () => formatSelectedText("_", "_") },
    { icon: LinkIcon, title: "Link", handler: () => formatSelectedText("[", "](url)") },
    { icon: CodeBracketIcon, title: "Inline code", handler: () => formatSelectedText("`", "`") },
    { icon: CodeBracketSquareIcon, title: "Code block", handler: () => formatSelectedText("\n```\n", "\n```\n") },
  ];

  const insertHeading = (prefix) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.slice(start, end);
    if (!selectedText) return;

    const leadingSpaces = selectedText.match(/^\s*/)[0];
    const trailingSpaces = selectedText.match(/\s*$/)[0];
    const trimmed = selectedText.trim().replace(/^#{1,6}\s+/, "");

    const newText =
      markdown.slice(0, start) +
      leadingSpaces +
      prefix +
      trimmed +
      trailingSpaces +
      markdown.slice(end);
    const newStart = start + leadingSpaces.length + prefix.length;
    const newEnd = newStart + trimmed.length;
    setMarkdown(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    });
  };

  const handleToolbarKeyDown = (e) => {
    if (!toolbarRef.current) return;
    const buttons = Array.from(toolbarRef.current.querySelectorAll("button:not([disabled]), label:not([disabled])"));
    const current = buttons.indexOf(document.activeElement);
    if (current === -1) return;
    let next = current;
    if (e.key === "ArrowRight") { e.preventDefault(); next = (current + 1) % buttons.length; }
    else if (e.key === "ArrowLeft") { e.preventDefault(); next = (current - 1 + buttons.length) % buttons.length; }
    else if (e.key === "Home") { e.preventDefault(); next = 0; }
    else if (e.key === "End") { e.preventDefault(); next = buttons.length - 1; }
    else return;
    setToolbarFocusIdx(next);
    buttons[next].focus();
  };

  const toolbarTabIndex = (idx) => (idx === toolbarFocusIdx ? 0 : -1);

  const headingButtons = [
    { label: "H1", handler: () => insertHeading("# ") },
    { label: "H2", handler: () => insertHeading("## ") },
    { label: "H3", handler: () => insertHeading("### ") },
  ];

  return (
    <div
      className={
        isDarkMode
          ? "bg-gray-800 text-white dark-theme h-screen grid grid-rows-[auto,1fr,auto]"
          : "bg-white text-gray-900 light-theme h-screen grid grid-rows-[auto,1fr,auto]"
      }
    >
      <header
        className={
          "app-header sticky top-0 z-10 flex items-center gap-2 px-3 py-2 border-b " +
          (isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200")
        }
      >
        {/* Logo + name */}
        <div className="app-brand flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="" className="h-7 w-7" aria-hidden="true" />
          <span className={"font-semibold text-sm tracking-tight " + (isDarkMode ? "text-white" : "text-gray-800")}>
            {isSharedView ? (initialWorkspace.sharedDocument.title || "Shared document") : "Markdown Editor"}
          </span>
          {isSharedView && <span className="shared-view-badge">Read-only shared copy</span>}
        </div>

        <span className={"w-px self-stretch mx-1 " + (isDarkMode ? "bg-gray-600" : "bg-gray-200")} aria-hidden="true" />

        {/* Formatting toolbar — centered */}
        {!isSharedView && <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Formatting toolbar"
          onKeyDown={handleToolbarKeyDown}
          className="formatting-toolbar flex items-center gap-1 flex-1 flex-wrap"
        >
          {iconButtons.map(({ icon: Icon, title, handler }, idx) => (
            <button
              key={title}
              onClick={handler}
              disabled={!isTextSelected}
              title={title}
              aria-label={title}
              tabIndex={toolbarTabIndex(idx)}
              className={`h-7 w-7 flex items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}

          <span className={"w-px h-5 mx-0.5 " + (isDarkMode ? "bg-gray-500" : "bg-gray-300")} aria-hidden="true" />

          {headingButtons.map(({ label, handler }, idx) => (
            <button
              key={label}
              onClick={handler}
              disabled={!isTextSelected}
              title={`Insert ${label}`}
              aria-label={`Insert ${label}`}
              tabIndex={toolbarTabIndex(iconButtons.length + idx)}
              className={`h-7 w-7 flex items-center justify-center rounded text-[11px] font-bold leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}
            >
              {label}
            </button>
          ))}

          <span className={"w-px h-5 mx-0.5 " + (isDarkMode ? "bg-gray-500" : "bg-gray-300")} aria-hidden="true" />

          <button onClick={saveToFile} disabled={!markdown} tabIndex={toolbarTabIndex(iconButtons.length + headingButtons.length)} title="Save to file" aria-label="Save to file" className={`h-7 w-7 flex items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}>
            <SaveIcon className="h-4 w-4" />
          </button>
          <button ref={publishingTriggerRef} onClick={() => { setShowPublishing(true); setShowInsights(false); setShowWorkspace(false); }} disabled={!markdown} tabIndex={toolbarTabIndex(iconButtons.length + headingButtons.length + 1)} title="Publishing studio" aria-label="Open publishing studio" className={`h-7 w-7 flex items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}>
            <ExportIcon className="h-4 w-4" />
          </button>
          <label tabIndex={toolbarTabIndex(iconButtons.length + headingButtons.length + 2)} title="Load file" aria-label="Load file" className={`h-7 w-7 flex items-center justify-center rounded transition-colors cursor-pointer ${btnTheme}`}>
            <LoadIcon className="h-4 w-4" />
            <input type="file" accept=".md,.txt" onChange={loadFromFile} className="sr-only" />
          </label>
          <button onClick={clearEditor}
            disabled={!markdown}
            tabIndex={toolbarTabIndex(iconButtons.length + headingButtons.length + 3)}
            title={confirmClear ? "Click again to confirm clear" : "Clear editor"}
            aria-label={confirmClear ? "Confirm clear" : "Clear editor"}
            className={`h-7 w-7 flex items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              confirmClear ? "bg-red-500 text-white hover:bg-red-600" : btnTheme
            }`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>

          {/* Version snapshots */}
          <div className="relative" ref={versionsRef}>
            <button
              onClick={() => setShowVersions(v => !v)}
              title="Saved snapshots"
              aria-label="Saved snapshots"
              aria-expanded={showVersions}
              className={`h-7 w-7 flex items-center justify-center rounded transition-colors relative ${btnTheme}`}
            >
              <SnapshotIcon className="h-4 w-4" />
              {versions.length > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-blue-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">{versions.length}</span>
              )}
            </button>
            {showVersions && (
              <div
                className={
                  "absolute top-full left-0 mt-1 z-20 rounded shadow-lg border min-w-[260px] " +
                  (isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200")
                }
                role="dialog"
                aria-label="Version snapshots"
              >
                <div className={"flex items-center justify-between px-3 py-2 border-b text-xs font-medium " + (isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600")}>
                  <span>Snapshots ({versions.length}/{MAX_VERSIONS})</span>
                  <button
                    onClick={saveVersion}
                    disabled={!markdown || versions.length >= MAX_VERSIONS}
                    className="px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    + Save current
                  </button>
                </div>
                {versions.length === 0 ? (
                  <p className={"px-3 py-3 text-xs " + (isDarkMode ? "text-gray-500" : "text-gray-400")}>No snapshots yet.</p>
                ) : (
                  <ul>
                    {versions.map(v => (
                      <li key={v.id} className={"flex items-center gap-2 px-3 py-2 border-b last:border-0 " + (isDarkMode ? "border-gray-700" : "border-gray-100")}>
                        <div className="flex-1 min-w-0">
                          <div className={"text-[0.65rem] " + (isDarkMode ? "text-gray-500" : "text-gray-400")}>{v.ts}</div>
                          <div className={"text-xs truncate " + (isDarkMode ? "text-gray-300" : "text-gray-700")}>{v.preview || "(empty)"}</div>
                        </div>
                        <button onClick={() => loadVersion(v)} className="shrink-0 text-xs px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors">Load</button>
                        <button onClick={() => deleteVersion(v.id)} className="shrink-0 text-xs px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors" aria-label="Delete snapshot">✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <span className={"w-px h-5 mx-0.5 " + (isDarkMode ? "bg-gray-500" : "bg-gray-300")} aria-hidden="true" />

          {/* Font size control */}
          <div className="flex items-center gap-0.5" role="group" aria-label="Editor font size">
            <button
              onClick={() => setFontSize(s => FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(s) - 1)])}
              disabled={fontSize === FONT_SIZES[0]}
              title="Decrease font size"
              aria-label="Decrease editor font size"
              className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}
            >A−</button>
            <span className={"text-xs tabular-nums " + (isDarkMode ? "text-gray-400" : "text-gray-500")} aria-live="polite" aria-atomic="true">{fontSize}px</span>
            <button
              onClick={() => setFontSize(s => FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(s) + 1)])}
              disabled={fontSize === FONT_SIZES[FONT_SIZES.length - 1]}
              title="Increase font size"
              aria-label="Increase editor font size"
              className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}
            >A+</button>
          </div>
          <span className={"w-px h-5 mx-0.5 " + (isDarkMode ? "bg-gray-500" : "bg-gray-300")} aria-hidden="true" />

          {/* Striped table toggle */}
          <button
            onClick={() => setIsStriped(s => !s)}
            title={isStriped ? "Disable striped table rows" : "Enable striped table rows"}
            aria-label={isStriped ? "Disable striped table rows" : "Enable striped table rows"}
            aria-pressed={isStriped}
            className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
              isStriped
                ? (isDarkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-100 text-blue-700 hover:bg-blue-200")
                : btnTheme
            }`}
          >
            <TableCellsIcon className="h-4 w-4" />
          </button>
        </div>}

        {/* View mode toggle */}
        {!isSharedView && <div
          className={"view-mode-control flex items-center rounded overflow-hidden border shrink-0 " + (isDarkMode ? "border-gray-600" : "border-gray-300")}
          role="group"
          aria-label="View mode"
        >
          {[
            { id: "editor", label: "Editor" },
            { id: "split",  label: "Split" },
            { id: "preview", label: "Preview" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              aria-pressed={viewMode === id}
              title={`${label} view`}
              className={
                "px-2 py-1 text-xs font-medium transition-colors " +
                (viewMode === id
                  ? (isDarkMode ? "bg-gray-500 text-white" : "bg-gray-300 text-gray-900")
                  : (isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white text-gray-600 hover:bg-gray-100"))
              }
            >
              {label}
            </button>
          ))}
        </div>}

        {/* Right rail — theme toggle + GitHub */}
        <div className="app-actions flex items-center gap-1 shrink-0">
          {!isSharedView && <button
            ref={workspaceTriggerRef}
            type="button"
            onClick={() => { setShowWorkspace((open) => !open); setShowInsights(false); setShowPublishing(false); }}
            className={`workspace-trigger p-1.5 rounded transition-colors ${showWorkspace ? "is-active" : ""} ${btnTheme}`}
            aria-label={showWorkspace ? "Close team workspace" : "Open team workspace"}
            aria-expanded={showWorkspace}
            title="Team workspace"
          >
            <WorkspaceIcon className="h-4 w-4" />
          </button>}
          <button
            ref={insightsTriggerRef}
            type="button"
            onClick={() => { setShowInsights((open) => !open); setShowWorkspace(false); setShowPublishing(false); }}
            className={`insights-trigger p-1.5 rounded transition-colors relative ${showInsights ? "is-active" : ""} ${btnTheme}`}
            aria-label={showInsights ? "Close document insights" : "Open document insights"}
            aria-expanded={showInsights}
            title="Document insights"
          >
            <InsightsIcon className="h-4 w-4" />
            {diagnostics.length > 0 && <span className="insights-count" aria-hidden="true">{Math.min(diagnostics.length, 9)}</span>}
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded transition-colors ${btnTheme}`}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode
              ? <SunIcon className="h-4 w-4 text-yellow-400" />
              : <MoonIcon className="h-4 w-4 text-blue-500" />
            }
          </button>
          <a
            href="https://github.com/peterbenoit/markdown-editor"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            className={`p-1.5 rounded transition-colors ${btnTheme}`}
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
        </div>
      </header>

      <div ref={paneContainerRef} className={`app-panes view-${viewMode} flex overflow-hidden${isDragging ? " select-none cursor-col-resize" : ""}`}>
        {viewMode !== "preview" && (
          <textarea
            ref={textareaRef}
            className={
              "editor-pane p-4 resize-none font-mono h-full focus:outline-none " +
              (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-900")
            }
            style={{
              fontSize: `${fontSize}px`,
              width: viewMode === "split" ? `${splitRatio}%` : "100%",
            }}
            value={markdown}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={checkTextSelection}
            onClick={updateCursor}
            onKeyUp={updateCursor}
            onScroll={handleEditorScroll}
            placeholder="Enter Markdown here..."
            spellCheck="false"
          />
        )}
        {viewMode === "split" && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor and preview panes"
            aria-valuenow={Math.round(splitRatio)}
            aria-valuemin={20}
            aria-valuemax={80}
            tabIndex={0}
            onMouseDown={handleDividerPointerDown}
            onTouchStart={handleDividerPointerDown}
            onKeyDown={handleDividerKeyDown}
            className={
              "pane-divider w-1.5 shrink-0 cursor-col-resize flex items-center justify-center " +
              (isDarkMode ? "bg-gray-600 hover:bg-blue-500" : "bg-gray-200 hover:bg-blue-400") +
              (isDragging ? " bg-blue-500" : "") +
              " transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            }
          />
        )}
        {viewMode !== "editor" && (
          <div
            ref={previewRef}
            onScroll={handlePreviewScroll}
            onClick={handleCopyClick}
            className={
              (viewMode === "split" ? "" : "w-full ") +
              "preview-pane p-4 overflow-y-auto markdown-content " +
              (isStriped ? "table-striped " : "") +
              (isDarkMode
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900")
            }
            style={{ width: viewMode === "split" ? `${100 - splitRatio}%` : undefined }}
          >
          <article
            className="preview-document"
            data-organization={publishingSettings.organization || undefined}
            style={{ "--document-accent": publishingSettings.accent }}
          >
          {meta && (
            <pre
              aria-label="Document metadata"
              className={
                "mb-4 p-3 rounded text-xs border font-mono leading-relaxed opacity-60 select-none overflow-x-auto " +
                (isDarkMode
                  ? "bg-gray-900 border-gray-700 text-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-500")
              }
            >
              {"---\n"}
              {Object.entries(meta).map(([k, v]) => `${k}: ${v}\n`).join("")}
              {"---"}
            </pre>
          )}
          {tableOfContentsHtml && <div dangerouslySetInnerHTML={{ __html: tableOfContentsHtml }} />}
          <div dangerouslySetInnerHTML={{ __html: html }} />
          </article>
          </div>
        )}
        {showInsights && (
          <DocumentInspector
            activeTab={insightsTab}
            diagnostics={diagnostics}
            diff={snapshotDiff}
            isDarkMode={isDarkMode}
            onApplyFix={applyDiagnosticFix}
            onClose={closeInsights}
            onJump={jumpToOffset}
            onTabChange={setInsightsTab}
            outline={documentOutline}
            snapshot={latestSnapshot}
          />
        )}
        {showPublishing && (
          <PublishingStudio
            isDarkMode={isDarkMode}
            onClose={closePublishing}
            onExportHtml={exportToHtml}
            onPrint={handlePrint}
            onSettingsChange={setPublishingSettings}
            onUseTemplate={usePublishingTemplate}
            settings={publishingSettings}
          />
        )}
        {showWorkspace && activeDocument && (
          <WorkspacePanel
            activeDocument={activeDocument}
            documents={documents}
            isDarkMode={isDarkMode}
            onAddComment={addWorkspaceComment}
            onClose={closeWorkspace}
            onCreate={createWorkspaceDocument}
            onDelete={deleteWorkspaceDocument}
            onDuplicate={duplicateWorkspaceDocument}
            onSelect={selectWorkspaceDocument}
            onShare={shareWorkspaceDocument}
            onStatusChange={(status) => updateWorkspaceDocument({ status })}
            selectedText={isTextSelected && textareaRef.current
              ? markdown.slice(textareaRef.current.selectionStart, textareaRef.current.selectionEnd)
              : ""}
          />
        )}
      </div>

      <footer
        className={
          "app-footer py-2 px-4 text-xs flex items-center justify-between gap-4 border-t " +
          (isDarkMode
            ? "bg-gray-900 text-gray-400 border-gray-700"
            : "bg-gray-100 text-gray-500 border-gray-200")
        }
      >
        <div aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</div>
        <span>
          <span>Words: {wordCount}</span>
          <span className="mx-2">·</span>
          <span>Characters: {charCount}</span>
          <span className="mx-2">·</span>
          <span>Ln {cursor.line}, Col {cursor.col}</span>
          <span className="mx-2">·</span>
          <span className={`save-status save-status-${saveStatus}`} role="status">
            <span aria-hidden="true">{saveStatus === "saved" || saveStatus === "shared" ? "✓" : saveStatus === "error" ? "!" : "•"}</span>
            {saveStatus === "shared" ? "Shared copy" : saveStatus === "saved" ? "Saved locally" : saveStatus === "error" ? "Save failed" : "Saving"}
          </span>
          {storageWarning && (
            <>
              <span className="mx-2">·</span>
              <span className="text-amber-500 font-medium" role="alert">Storage nearly full — save to file</span>
            </>
          )}
        </span>
        <span>
          Built by{" "}
          <a
            href="https://peterbenoit.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}
          >
            Peter Benoit
          </a>
          {" · "}
          <a
            href="https://peterbenoit.com/md-fun/"
            target="_blank"
            rel="noopener noreferrer"
            className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}
          >
            Portfolio page
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;

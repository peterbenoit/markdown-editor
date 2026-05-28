import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import {
  SunIcon,
  MoonIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  CodeBracketIcon,
} from "./icons.jsx";
import "highlight.js/styles/atom-one-dark.css";
import "./index.css";

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
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
  return { meta, body: text.slice(match[0].length) };
}

function App() {
  const [markdown, setMarkdown] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("markdown");
    if (saved) setMarkdown(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("markdown", markdown);
  }, [markdown]);

  const formatSelectedText = (before, after = "") => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.slice(start, end);
    if (!selectedText) return;

    const leadingSpaces = selectedText.match(/^\s*/)[0];
    const trailingSpaces = selectedText.match(/\s*$/)[0];
    const trimmedText = selectedText.trim();

    setMarkdown(
      markdown.slice(0, start) +
        leadingSpaces +
        before +
        trimmedText +
        after +
        trailingSpaces +
        markdown.slice(end)
    );
    textarea.focus();
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
    }
  };

  const checkTextSelection = () => {
    const textarea = textareaRef.current;
    setIsTextSelected(textarea.selectionStart !== textarea.selectionEnd);
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

  const loadFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMarkdown(ev.target.result);
    reader.readAsText(file);
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

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = getPlainText(markdown).length;
  const { meta, body } = parseFrontmatter(markdown);
  const html = DOMPurify.sanitize(marked.parse(body));

  const btnTheme = isDarkMode
    ? "bg-gray-600 text-gray-100 hover:bg-gray-500"
    : "bg-gray-200 text-gray-800 hover:bg-gray-300";

  const iconButtons = [
    { icon: BoldIcon, title: "Bold", handler: () => formatSelectedText("**", "**") },
    { icon: ItalicIcon, title: "Italic", handler: () => formatSelectedText("_", "_") },
    { icon: LinkIcon, title: "Link", handler: () => formatSelectedText("[", "](url)") },
    { icon: CodeBracketIcon, title: "Inline code", handler: () => formatSelectedText("`", "`") },
    { icon: CodeBracketIcon, title: "Code block", handler: () => formatSelectedText("\n```\n", "\n```\n") },
  ];

  const headingButtons = [
    { label: "H1", handler: () => formatSelectedText("# ") },
    { label: "H2", handler: () => formatSelectedText("## ") },
    { label: "H3", handler: () => formatSelectedText("### ") },
  ];

  return (
    <div
      className={
        isDarkMode
          ? "bg-gray-800 text-white dark-theme min-h-screen grid grid-rows-[auto,1fr,auto]"
          : "bg-white text-gray-900 light-theme min-h-screen grid grid-rows-[auto,1fr,auto]"
      }
    >
      <div
        className={
          "flex items-center gap-1 p-3 border-b flex-wrap " +
          (isDarkMode ? "border-gray-600" : "border-gray-300")
        }
      >
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded transition-colors ${btnTheme} mr-1`}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode
            ? <SunIcon className="h-5 w-5 text-yellow-400" />
            : <MoonIcon className="h-5 w-5 text-blue-500" />
          }
        </button>

        {iconButtons.map(({ icon: Icon, title, handler }) => (
          <button
            key={title}
            onClick={handler}
            disabled={!isTextSelected}
            title={title}
            aria-label={title}
            className={`p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}

        <span className={`w-px h-6 mx-1 ${isDarkMode ? "bg-gray-500" : "bg-gray-300"}`} aria-hidden="true" />

        {headingButtons.map(({ label, handler }) => (
          <button
            key={label}
            onClick={handler}
            disabled={!isTextSelected}
            title={`Insert ${label}`}
            aria-label={`Insert ${label}`}
            className={`px-2 py-1 rounded text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btnTheme}`}
          >
            {label}
          </button>
        ))}

        <div className="flex items-center gap-1 ml-2">
          <button onClick={saveToFile} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${btnTheme}`}>
            Save
          </button>
          <label className={`px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer ${btnTheme}`}>
            Load
            <input
              type="file"
              accept=".md,.txt"
              onChange={loadFromFile}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div className="flex overflow-hidden">
        <textarea
          ref={textareaRef}
          className={
            "w-1/2 p-4 resize-none font-mono text-sm h-full focus:outline-none " +
            (isDarkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-900")
          }
          value={markdown}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={checkTextSelection}
          placeholder="Enter Markdown here..."
          spellCheck="false"
        />
        <div
          className={
            "w-1/2 p-4 border-l overflow-y-auto markdown-content " +
            (isDarkMode
              ? "bg-gray-800 text-white border-gray-600"
              : "bg-white text-gray-900 border-gray-200")
          }
        >
          {meta && (
            <dl
              className={
                "mb-4 p-3 rounded text-xs border grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 " +
                (isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-300"
                  : "bg-gray-50 border-gray-200 text-gray-500")
              }
              aria-label="Document metadata"
            >
              {Object.entries(meta).map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt className="font-semibold capitalize">{k}</dt>
                  <dd>{v}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      <div
        className={
          "py-2 px-4 text-xs flex gap-4 border-t " +
          (isDarkMode
            ? "bg-gray-900 text-gray-400 border-gray-700"
            : "bg-gray-100 text-gray-500 border-gray-200")
        }
      >
        <span>Words: {wordCount}</span>
        <span>Characters: {charCount}</span>
      </div>
    </div>
  );
}

export default App;

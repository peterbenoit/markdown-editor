import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
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
  const html = DOMPurify.sanitize(marked.parse(markdown));

  const btnBase =
    "px-2 py-1 rounded text-sm font-mono font-semibold transition-opacity disabled:opacity-30 disabled:cursor-not-allowed";
  const btnTheme = isDarkMode
    ? "bg-gray-600 text-gray-100 hover:bg-gray-500"
    : "bg-gray-200 text-gray-800 hover:bg-gray-300";

  const toolbarButtons = [
    { label: "B", title: "Bold", handler: () => formatSelectedText("**", "**") },
    { label: "I", title: "Italic", handler: () => formatSelectedText("_", "_") },
    { label: "H1", title: "Heading", handler: () => formatSelectedText("# ") },
    { label: "Link", title: "Link", handler: () => formatSelectedText("[", "](url)") },
    { label: "\`code\`", title: "Inline code", handler: () => formatSelectedText("\`", "\`") },
    { label: "\`\`\`", title: "Code block", handler: () => formatSelectedText("\n\`\`\`\n", "\n\`\`\`\n") },
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
          className={btnBase + " " + btnTheme + " mr-2"}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? "Light" : "Dark"}
        </button>

        {toolbarButtons.map(({ label, title, handler }) => (
          <button
            key={title}
            onClick={handler}
            disabled={!isTextSelected}
            title={title}
            className={btnBase + " " + btnTheme}
          >
            {label}
          </button>
        ))}

        <div className="flex items-center gap-1 ml-2">
          <button onClick={saveToFile} className={btnBase + " " + btnTheme}>
            Save
          </button>
          <label className={btnBase + " " + btnTheme + " cursor-pointer"}>
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
          dangerouslySetInnerHTML={{ __html: html }}
        />
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

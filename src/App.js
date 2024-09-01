import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // Import the highlight.js theme
import {
  SunIcon,
  MoonIcon,
  CodeBracketIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline"; // Corrected Heroicons v2 imports
import "./index.css";

function App() {
  const [markdown, setMarkdown] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode state
  const textareaRef = useRef(null); // Reference to the textarea

  // Configure marked to use highlight.js for code blocks
  useEffect(() => {
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      },
      langPrefix: "hljs language-", // Prefix for highlight.js classes
    });
  }, []);

  // Load saved markdown from local storage on mount
  useEffect(() => {
    const savedMarkdown = localStorage.getItem("markdown");
    if (savedMarkdown) setMarkdown(savedMarkdown);
  }, []);

  // Save markdown to local storage on change
  useEffect(() => {
    localStorage.setItem("markdown", markdown);
  }, [markdown]);

  // Function to format selected text
  const formatSelectedText = (before, after = "") => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.slice(start, end);
    const newMarkdown =
      markdown.slice(0, start) +
      before +
      selectedText +
      after +
      markdown.slice(end);
    setMarkdown(newMarkdown);
    textarea.focus();
  };

  // Handlers for markdown formatting
  const handleBold = () => formatSelectedText("**", "**");
  const handleItalic = () => formatSelectedText("_", "_");
  const handleHeader = () => formatSelectedText("# ", "");
  const handleLink = () => formatSelectedText("[", "](url)");
  const handleInlineCode = () => formatSelectedText("`", "`");
  const handleBlockCode = () => formatSelectedText("\n```\n", "\n```\n");

  const handleChange = (event) => setMarkdown(event.target.value);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Save markdown to a file
  const saveToFile = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "markdown.md";
    link.click();
  };

  // Load markdown from a file
  const loadFromFile = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => setMarkdown(e.target.result);
    if (file) reader.readAsText(file);
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      } min-h-screen grid grid-rows-[auto,1fr,auto]`}
    >
      {/* Fixed top toolbar */}
      <div className="flex items-center p-4 bg-gray-200 dark:bg-gray-700">
        <button onClick={toggleDarkMode} className="mr-3 p-2">
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <MoonIcon className="h-5 w-5 text-blue-500" />
          )}
        </button>
        <div className="flex space-x-2">
          <button onClick={handleBold} className="p-2">
            <BoldIcon className="h-5 w-5" />
          </button>
          <button onClick={handleItalic} className="p-2">
            <ItalicIcon className="h-5 w-5" />
          </button>
          <button onClick={handleHeader} className="p-2">
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
          <button onClick={handleLink} className="p-2">
            <LinkIcon className="h-5 w-5" />
          </button>
          <button onClick={handleInlineCode} className="p-2">
            <CodeBracketIcon className="h-5 w-5" />
          </button>
          <button onClick={handleBlockCode} className="p-2">
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
          <button onClick={saveToFile} className="p-2">
            Save to File
          </button>
          <input type="file" onChange={loadFromFile} className="p-2" />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex">
        <textarea
          ref={textareaRef}
          className={`w-1/2 p-4 resize-none ${
            isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
          } h-full`}
          value={markdown}
          onChange={handleChange}
          placeholder="Enter Markdown text here..."
        />

        <div
          className={`w-1/2 p-4 border-l overflow-y-scroll ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
          } h-full`}
          dangerouslySetInnerHTML={{ __html: marked(markdown) }}
        />
      </div>

      {/* Fixed bottom toolbar */}
      <div
        className={`py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white flex justify-between items-center`}
      >
        <div className="flex items-center space-x-4">
          <span>Words: {markdown.split(/\s+/).filter(Boolean).length}</span>
          <span>Characters: {markdown.length}</span>
        </div>
      </div>
    </div>
  );
}

export default App;

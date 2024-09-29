import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import "highlight.js/styles/github.css";
import {
  SunIcon,
  MoonIcon,
  CodeBracketIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import "./index.css";

function App() {
  const [markdown, setMarkdown] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const textareaRef = useRef(null);

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
      langPrefix: "hljs language-",
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

  // Inside the effect hook to update highlighting
  useEffect(() => {
    hljs.highlightAll();
  }, [markdown, isDarkMode]);

  // Function to format selected text and handle spaces
  const formatSelectedText = (before, after = "") => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.slice(start, end);

    if (!selectedText) return;

    // Trim spaces and add them back after formatting
    const leadingSpaces = selectedText.match(/^\s*/)[0];
    const trailingSpaces = selectedText.match(/\s*$/)[0];
    const trimmedText = selectedText.trim();

    const newMarkdown =
      markdown.slice(0, start) +
      leadingSpaces +
      before +
      trimmedText +
      after +
      trailingSpaces +
      markdown.slice(end);
    setMarkdown(newMarkdown);
    textarea.focus();
  };

  // Check if text is selected in the textarea
  const checkTextSelection = () => {
    const textarea = textareaRef.current;
    const isTextSelected = textarea.selectionStart !== textarea.selectionEnd;
    setIsTextSelected(isTextSelected);
  };

  // Handlers for markdown formatting
  const handleBold = () => formatSelectedText("**", "**");
  const handleItalic = () => formatSelectedText("_", "_");
  const handleHeader = () => formatSelectedText("# ", "");
  const handleLink = () => formatSelectedText("[", "](url)");
  const handleInlineCode = () => formatSelectedText("`", "`");
  const handleBlockCode = () => formatSelectedText("\n```\n", "\n```\n");

  const handleChange = (event) => {
    setMarkdown(event.target.value);
    checkTextSelection();
  };

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

  // Function to strip Markdown formatting and get the plain text
  const getPlainText = (markdown) => {
    return markdown
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/```([\s\S]*?)```/g, "$1")
      .replace(
        /$begin:math:display$(.*?)$end:math:display$$begin:math:text$(.*?)$end:math:text$/g,
        "$1"
      ) // Links
      .replace(/^# (.*$)/gim, "$1")
      .replace(/^\s*[\r\n]/gm, "");
  };

  // Adjusted character count
  const characterCount = getPlainText(markdown).length;

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      } min-h-screen grid grid-rows-[auto,1fr,auto] ${
        isDarkMode ? "dark-theme" : "light-theme"
      }`}
    >
      {/* Fixed top toolbar */}
      <div className="flex items-center p-4">
        <button onClick={toggleDarkMode} className="mr-3 p-2">
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <MoonIcon className="h-5 w-5 text-blue-500" />
          )}
        </button>
        <div className="flex space-x-2">
          <button
            onClick={handleBold}
            className="p-2"
            disabled={!isTextSelected}
          >
            <BoldIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleItalic}
            className="p-2"
            disabled={!isTextSelected}
          >
            <ItalicIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleHeader}
            className="p-2"
            disabled={!isTextSelected}
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleLink}
            className="p-2"
            disabled={!isTextSelected}
          >
            <LinkIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleInlineCode}
            className="p-2"
            disabled={!isTextSelected}
          >
            <CodeBracketIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleBlockCode}
            className="p-2"
            disabled={!isTextSelected}
          >
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
          onSelect={checkTextSelection}
          placeholder="Enter Markdown text here..."
        />

        <div
          className={`w-1/2 p-4 border-l overflow-y-scroll ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
          } h-full markdown-content`}
          dangerouslySetInnerHTML={{ __html: marked(markdown) }}
        />
      </div>

      {/* Fixed bottom toolbar */}
      <div
        className={`py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white flex justify-between items-center`}
      >
        <div className="flex items-center space-x-4">
          <span>Words: {markdown.split(/\s+/).filter(Boolean).length}</span>
          <span>Characters: {characterCount}</span>
        </div>
      </div>
    </div>
  );
}

export default App;

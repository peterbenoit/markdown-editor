import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // Import a highlight.js theme

function App() {
  const [markdown, setMarkdown] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode state
  const textareaRef = useRef(null); // Reference to the textarea

  // Configure marked to use highlight.js for code blocks
  useEffect(() => {
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
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
      style={{
        backgroundColor: isDarkMode ? "#333" : "#fff",
        color: isDarkMode ? "#fff" : "#000",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <button onClick={toggleDarkMode} style={{ marginBottom: "20px" }}>
        Toggle Dark Mode
      </button>
      <div>
        <button onClick={handleBold}>Bold</button>
        <button onClick={handleItalic}>Italic</button>
        <button onClick={handleHeader}>Header</button>
        <button onClick={handleLink}>Link</button>
        <button onClick={saveToFile}>Save to File</button>
        <input type="file" onChange={loadFromFile} />
      </div>

      <div style={{ display: "flex", padding: "20px" }}>
        <textarea
          ref={textareaRef} // Attach the reference to the textarea
          style={{
            width: "50%",
            height: "400px",
            marginRight: "20px",
            backgroundColor: isDarkMode ? "#555" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
          }}
          value={markdown}
          onChange={handleChange}
          placeholder="Enter Markdown text here..."
        />

        <div
          style={{
            width: "50%",
            height: "400px",
            overflowY: "scroll",
            padding: "10px",
            border: "1px solid #ddd",
            backgroundColor: isDarkMode ? "#222" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
          }}
          dangerouslySetInnerHTML={{ __html: marked(markdown) }}
        />
      </div>

      <p>Words: {markdown.split(/\s+/).filter(Boolean).length}</p>
      <p>Characters: {markdown.length}</p>
    </div>
  );
}

export default App;

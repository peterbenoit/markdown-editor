import React, { useEffect, useRef } from "react";

const TABS = ["outline", "quality", "changes"];

export default function DocumentInspector({
  activeTab,
  diagnostics,
  diff,
  isDarkMode,
  onApplyFix,
  onClose,
  onJump,
  onTabChange,
  outline,
  snapshot,
}) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (!event.target.matches('[role="tab"]')) return;
    const index = TABS.indexOf(activeTab);
    const tablist = event.currentTarget;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextTab = TABS[(index + 1) % TABS.length];
      onTabChange(nextTab);
      requestAnimationFrame(() => tablist.querySelector(`[role="tab"][aria-selected="true"]`)?.focus());
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const nextTab = TABS[(index - 1 + TABS.length) % TABS.length];
      onTabChange(nextTab);
      requestAnimationFrame(() => tablist.querySelector(`[role="tab"][aria-selected="true"]`)?.focus());
    }
  };

  const errors = diagnostics.filter(({ severity }) => severity === "error").length;
  const warnings = diagnostics.filter(({ severity }) => severity === "warning").length;
  const changedLines = diff.filter(({ type }) => type !== "equal").length;

  return (
    <aside
      role="dialog"
      aria-label="Document insights"
      aria-modal="false"
      onKeyDown={handleKeyDown}
      className={`document-inspector ${isDarkMode ? "document-inspector-dark" : ""}`}
    >
      <div className="inspector-header">
        <div>
          <span className="inspector-eyebrow">Document intelligence</span>
          <h2>Insights</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspector-close" aria-label="Close document insights">×</button>
      </div>

      <div className="inspector-tabs" role="tablist" aria-label="Document insight views">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => onTabChange(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="inspector-body" role="tabpanel" aria-label={`${activeTab} insights`}>
        {activeTab === "outline" && (
          outline.length ? (
            <nav aria-label="Document outline" className="outline-list">
              {outline.map((heading) => (
                <button
                  key={`${heading.offset}-${heading.text}`}
                  type="button"
                  onClick={() => onJump(heading.offset)}
                  style={{ "--outline-depth": heading.depth - 1 }}
                >
                  <span className="outline-level">H{heading.depth}</span>
                  <span>{heading.text}</span>
                  <span className="outline-line">{heading.line}</span>
                </button>
              ))}
            </nav>
          ) : <InspectorEmpty title="No headings yet" copy="Add headings to create a navigable document outline." />
        )}

        {activeTab === "quality" && (
          <>
            <div className={`quality-summary ${diagnostics.length ? "has-issues" : "is-clear"}`}>
              <span className="quality-summary-mark" aria-hidden="true">{diagnostics.length ? "!" : "✓"}</span>
              <div>
                <strong>{diagnostics.length ? `${diagnostics.length} ${diagnostics.length === 1 ? "issue" : "issues"} found` : "Document checks passed"}</strong>
                <span>{errors} errors · {warnings} warnings</span>
              </div>
            </div>
            {diagnostics.length ? (
              <ol className="diagnostic-list">
                {diagnostics.map((diagnostic, index) => (
                  <li key={`${diagnostic.id}-${diagnostic.offset}-${index}`} className={`diagnostic-${diagnostic.severity}`}>
                    <button type="button" className="diagnostic-main" onClick={() => onJump(diagnostic.offset)}>
                      <span className="diagnostic-meta"><span>{diagnostic.category}</span>Line {diagnostic.line}</span>
                      <strong>{diagnostic.message}</strong>
                    </button>
                    {diagnostic.fix && (
                      <button type="button" className="diagnostic-fix" onClick={() => onApplyFix(diagnostic.fix)}>
                        {diagnostic.fix.label}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            ) : <p className="quality-clear-copy">Structure, internal links, and accessibility checks all look good.</p>}
          </>
        )}

        {activeTab === "changes" && (
          snapshot ? (
            <>
              <div className="diff-summary">
                <strong>{changedLines} changed {changedLines === 1 ? "line" : "lines"}</strong>
                <span>Compared with {snapshot.ts}</span>
              </div>
              <div className="diff-view" aria-label="Changes from latest snapshot">
                {diff.map((line, index) => (
                  <div key={`${line.type}-${index}`} className={`diff-line diff-${line.type}`}>
                    <span>{line.oldLine ?? ""}</span>
                    <span>{line.newLine ?? ""}</span>
                    <code>{line.type === "add" ? "+ " : line.type === "remove" ? "− " : "  "}{line.text || " "}</code>
                  </div>
                ))}
              </div>
            </>
          ) : <InspectorEmpty title="No snapshot to compare" copy="Save a snapshot, then return here to review every changed line." />
        )}
      </div>
    </aside>
  );
}

function InspectorEmpty({ title, copy }) {
  return (
    <div className="inspector-empty">
      <span aria-hidden="true">◇</span>
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

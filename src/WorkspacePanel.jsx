import React, { useEffect, useRef, useState } from "react";

const STATUS_LABELS = { draft: "Draft", "in-review": "In review", approved: "Approved" };

export default function WorkspacePanel({
  activeDocument,
  documents,
  isDarkMode,
  onAddComment,
  onClose,
  onCreate,
  onDelete,
  onDuplicate,
  onSelect,
  onShare,
  onStatusChange,
  selectedText,
}) {
  const closeRef = useRef(null);
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState(() => localStorage.getItem("md-reviewer-name") || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareState, setShareState] = useState("idle");

  useEffect(() => closeRef.current?.focus(), []);

  const submitComment = (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    localStorage.setItem("md-reviewer-name", author.trim());
    onAddComment(comment.trim(), author.trim() || "Reviewer");
    setComment("");
  };

  const share = async () => {
    setShareState("working");
    try {
      await onShare();
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("error");
    }
  };

  return (
    <aside
      role="dialog"
      aria-label="Team workspace"
      aria-modal="false"
      className={`document-inspector workspace-panel ${isDarkMode ? "document-inspector-dark" : ""}`}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
    >
      <div className="inspector-header">
        <div><span className="inspector-eyebrow">Local-first collaboration</span><h2>Workspace</h2></div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspector-close" aria-label="Close team workspace">×</button>
      </div>

      <div className="workspace-body">
        <section className="workspace-documents" aria-labelledby="workspace-documents-title">
          <div className="publishing-section-heading">
            <h3 id="workspace-documents-title">Documents</h3><span>{documents.length}</span>
          </div>
          <div className="workspace-document-list">
            {documents.map((document) => (
              <button key={document.id} type="button" className={document.id === activeDocument.id ? "is-active" : ""} onClick={() => onSelect(document.id)}>
                <span><strong>{document.title}</strong><small>{new Date(document.updatedAt).toLocaleDateString()}</small></span>
                <span className={`review-status status-${document.status}`}>{STATUS_LABELS[document.status]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="workspace-new" onClick={onCreate}>+ New document</button>
        </section>

        <section aria-labelledby="workspace-review-title">
          <h3 id="workspace-review-title">Review workflow</h3>
          <div className="publishing-field">
            <label htmlFor="workspace-status">Document status</label>
            <select id="workspace-status" value={activeDocument.status} onChange={(event) => onStatusChange(event.target.value)}>
              <option value="draft">Draft</option><option value="in-review">In review</option><option value="approved">Approved</option>
            </select>
          </div>
          <div className="workspace-row-actions">
            <button type="button" onClick={onDuplicate}>Duplicate</button>
            {confirmDelete ? (
              <><button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button><button type="button" className="workspace-delete-confirm" onClick={onDelete}>Confirm delete</button></>
            ) : <button type="button" disabled={documents.length === 1} onClick={() => setConfirmDelete(true)}>Delete</button>}
          </div>
          <button type="button" className="workspace-share" onClick={share} disabled={shareState === "working"} aria-live="polite">
            {shareState === "working" ? "Preparing link…" : shareState === "copied" ? "Read-only link copied" : shareState === "error" ? "Could not copy link — try again" : "Copy read-only share link"}
          </button>
          <p className="workspace-privacy">The link contains a portable copy of this document. Nothing is uploaded by the editor.</p>
        </section>

        <section aria-labelledby="workspace-comments-title">
          <div className="publishing-section-heading"><h3 id="workspace-comments-title">Review comments</h3><span>{activeDocument.comments.length}</span></div>
          <form onSubmit={submitComment} className="comment-form">
            {selectedText && <blockquote>“{selectedText.slice(0, 120)}{selectedText.length > 120 ? "…" : ""}”</blockquote>}
            <label htmlFor="comment-author">Your name</label>
            <input id="comment-author" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Reviewer" />
            <label htmlFor="comment-text">Comment</label>
            <textarea id="comment-text" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={selectedText ? "Comment on the selected text" : "Add a document-level comment"} />
            <button type="submit" disabled={!comment.trim()}>Add comment</button>
          </form>
          <ol className="comment-list">
            {activeDocument.comments.map((item) => (
              <li key={item.id}>
                <div><strong>{item.author}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div>
                {item.quote && <blockquote>“{item.quote}”</blockquote>}
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  );
}

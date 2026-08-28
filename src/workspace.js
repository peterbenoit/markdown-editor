const MAX_SHARE_CONTENT_LENGTH = 50000;

const bytesToBase64 = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64ToBytes = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export function deriveDocumentTitle(markdown) {
  const match = markdown.match(/^#\s+(.+?)\s*#*\s*$/m);
  return match?.[1]?.trim() || "Untitled document";
}

export function createShareHash(document) {
  const content = document.content || "";
  if (content.length > MAX_SHARE_CONTENT_LENGTH) {
    throw new Error("Document is too large for a portable share link.");
  }
  const payload = JSON.stringify({
    title: document.title || deriveDocumentTitle(content),
    content,
    status: document.status || "draft",
    comments: document.comments || [],
  });
  return `#share=${bytesToBase64(new TextEncoder().encode(payload))}`;
}

export function parseShareHash(hash) {
  if (!hash.startsWith("#share=")) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64ToBytes(hash.slice(7))));
    if (!payload || typeof payload.content !== "string" || payload.content.length > MAX_SHARE_CONTENT_LENGTH) return null;
    return payload;
  } catch {
    return null;
  }
}

export function normalizeWorkspaceDocuments(value) {
  if (!Array.isArray(value)) return [];
  const validStatuses = new Set(["draft", "in-review", "approved"]);
  return value.flatMap((document) => {
    if (!document || typeof document.content !== "string") return [];
    const comments = Array.isArray(document.comments)
      ? document.comments.filter((comment) => comment && typeof comment.text === "string").map((comment) => ({
        id: typeof comment.id === "string" ? comment.id : crypto.randomUUID(),
        author: typeof comment.author === "string" && comment.author.trim() ? comment.author : "Reviewer",
        text: comment.text,
        quote: typeof comment.quote === "string" ? comment.quote : "",
        createdAt: Number.isFinite(comment.createdAt) ? comment.createdAt : Date.now(),
      }))
      : [];
    return [{
      id: typeof document.id === "string" && document.id ? document.id : crypto.randomUUID(),
      title: typeof document.title === "string" && document.title.trim() ? document.title : deriveDocumentTitle(document.content),
      content: document.content,
      status: validStatuses.has(document.status) ? document.status : "draft",
      comments,
      updatedAt: Number.isFinite(document.updatedAt) ? document.updatedAt : Date.now(),
    }];
  });
}

export function makeWorkspaceDocument(content = "# Untitled document\n\nStart writing here.") {
  return {
    id: crypto.randomUUID(),
    title: deriveDocumentTitle(content),
    content,
    status: "draft",
    comments: [],
    updatedAt: Date.now(),
  };
}

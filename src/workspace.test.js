import { createShareHash, deriveDocumentTitle, normalizeWorkspaceDocuments, parseShareHash } from "./workspace";

test("derives a document title from the first level-one heading", () => {
  expect(deriveDocumentTitle("Intro\n\n# Delivery plan\n\nDetails")).toBe("Delivery plan");
  expect(deriveDocumentTitle("No title here")).toBe("Untitled document");
});

test("round-trips a Unicode read-only share payload", () => {
  const document = {
    title: "Résumé notes",
    content: "# Résumé notes\n\nShip it 🚀",
    status: "in-review",
    comments: [{ id: "1", text: "Looks good", quote: "Ship it", author: "Pete" }],
  };
  const hash = createShareHash(document);

  expect(hash.startsWith("#share=")).toBe(true);
  expect(parseShareHash(hash)).toEqual(document);
});

test("rejects malformed or oversized share payloads", () => {
  expect(parseShareHash("#share=not-valid-base64")).toBeNull();
  expect(() => createShareHash({ content: "x".repeat(50001) })).toThrow(/too large/i);
});

test("repairs stale workspace records without discarding valid content", () => {
  const documents = normalizeWorkspaceDocuments([
    { id: "legacy", content: "# Preserved", status: "unknown", comments: null, updatedAt: "yesterday" },
    null,
  ]);

  expect(documents).toHaveLength(1);
  expect(documents[0]).toMatchObject({ id: "legacy", title: "Preserved", content: "# Preserved", status: "draft", comments: [] });
  expect(Number.isFinite(documents[0].updatedAt)).toBe(true);
});

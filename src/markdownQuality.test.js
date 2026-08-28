import { analyzeMarkdown, getDocumentOutline, getLineDiff } from "./markdownQuality";

test("builds an outline from real headings and ignores fenced code", () => {
  const markdown = [
    "# Release plan",
    "",
    "## Scope",
    "",
    "```md",
    "# Not a document heading",
    "```",
    "",
    "### Rollout",
  ].join("\n");

  expect(getDocumentOutline(markdown)).toEqual([
    { depth: 1, text: "Release plan", line: 1, offset: 0 },
    { depth: 2, text: "Scope", line: 3, offset: 16 },
    { depth: 3, text: "Rollout", line: 9, offset: markdown.indexOf("### Rollout") },
  ]);
});

test("creates a stable line diff for snapshot comparison", () => {
  expect(getLineDiff("# Title\nNew copy", "# Title\nOld copy")).toEqual([
    { type: "equal", text: "# Title", oldLine: 1, newLine: 1 },
    { type: "remove", text: "Old copy", oldLine: 2, newLine: null },
    { type: "add", text: "New copy", oldLine: null, newLine: 2 },
  ]);
});

test("reports actionable document structure, image, and link issues", () => {
  const markdown = [
    "## Overview",
    "",
    "#### Details",
    "",
    "![](diagram.png)",
    "",
    "[Click here](url) and [jump](#missing-section).",
  ].join("\n");

  const diagnostics = analyzeMarkdown(markdown);
  expect(diagnostics.map(({ id }) => id)).toEqual(expect.arrayContaining([
    "heading-missing-h1",
    "heading-skipped-level",
    "image-missing-alt",
    "link-vague-text",
    "link-placeholder-target",
    "link-missing-fragment",
  ]));

  const missingTitle = diagnostics.find(({ id }) => id === "heading-missing-h1");
  expect(missingTitle.fix).toEqual({
    label: "Add document title",
    start: 0,
    end: 0,
    text: "# Document title\n\n",
  });
});

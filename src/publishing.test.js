import { buildTableOfContentsHtml, getPublishingTemplate } from "./publishing";

test("builds a linked and escaped table of contents", () => {
  const html = buildTableOfContentsHtml([
    { depth: 1, text: "Plan & scope" },
    { depth: 2, text: "Rollout <safe>" },
  ]);

  expect(html).toContain('href="#plan-scope"');
  expect(html).toContain("Plan &amp; scope");
  expect(html).toContain("Rollout &lt;safe&gt;");
  expect(html).toContain('class="toc-depth-2"');
});

test("personalizes a built-in publishing template", () => {
  const template = getPublishingTemplate("decision-record", "Brick City Creative");
  expect(template).toContain("organization: Brick City Creative");
  expect(template).toContain("# Architecture decision record");
});

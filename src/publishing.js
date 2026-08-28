const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugify = (text) =>
  text
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

export const PUBLISHING_TEMPLATES = [
  { id: "technical-brief", name: "Technical brief", description: "Context, approach, implementation, and validation." },
  { id: "meeting-notes", name: "Meeting notes", description: "Attendees, decisions, discussion, and action items." },
  { id: "decision-record", name: "Decision record", description: "A durable architecture or product decision with trade-offs." },
];

const templates = {
  "technical-brief": (organization) => `---\norganization: ${organization}\ntype: Technical brief\nstatus: Draft\n---\n\n# Technical brief\n\n## Executive summary\n\nSummarize the proposal and the outcome it enables.\n\n## Context\n\nDescribe the problem, constraints, and affected teams.\n\n## Approach\n\nExplain the recommended approach.\n\n## Implementation\n\n1. First milestone\n2. Second milestone\n3. Validation and rollout\n\n## Risks and mitigations\n\n| Risk | Impact | Mitigation |\n|:--|:--:|:--|\n| Example risk | Medium | Describe the response |\n\n## Success criteria\n\n- [ ] Define a measurable outcome\n- [ ] Identify an owner\n`,
  "meeting-notes": (organization) => `---\norganization: ${organization}\ntype: Meeting notes\nstatus: Draft\n---\n\n# Meeting notes\n\n**Date:** ${new Date().toLocaleDateString()}  \n**Attendees:** Add attendees\n\n## Purpose\n\nState what this meeting needs to accomplish.\n\n## Decisions\n\n- Record decisions and owners.\n\n## Discussion\n\nCapture the details needed by people who were not in the room.\n\n## Action items\n\n- [ ] Action — **Owner** — Due date\n`,
  "decision-record": (organization) => `---\norganization: ${organization}\ntype: Architecture decision record\nstatus: Proposed\n---\n\n# Architecture decision record\n\n## Decision\n\nState the decision in one clear sentence.\n\n## Context\n\nExplain the forces and constraints that shaped this decision.\n\n## Options considered\n\n### Selected option\n\nDescribe the chosen approach.\n\n### Alternatives\n\nDescribe credible alternatives and why they were not selected.\n\n## Consequences\n\n### Positive\n\n- Expected benefit\n\n### Trade-offs\n\n- Cost or limitation we are accepting\n\n## Validation\n\nExplain how the decision will be evaluated.\n`,
};

export function getPublishingTemplate(id, organization = "Your organization") {
  return templates[id]?.(organization.trim() || "Your organization") || "";
}

export function buildTableOfContentsHtml(outline) {
  if (!outline.length) return "";
  const items = outline
    .map(({ depth, text }) => `<li class="toc-depth-${depth}"><a href="#${slugify(text)}">${escapeHtml(text)}</a></li>`)
    .join("");
  return `<nav class="document-toc" aria-label="Table of contents"><h2>Contents</h2><ol>${items}</ol></nav>`;
}

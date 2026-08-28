const getLines = (markdown) => {
  const lines = markdown.split("\n");
  let offset = 0;

  return lines.map((text, index) => {
    const line = { text, line: index + 1, offset };
    offset += text.length + 1;
    return line;
  });
};

export function getDocumentOutline(markdown) {
  const outline = [];
  let fence = null;

  for (const item of getLines(markdown)) {
    const fenceMatch = item.text.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fence === fenceMatch[1][0]) fence = null;
      continue;
    }
    if (fence) continue;

    const match = item.text.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    outline.push({
      depth: match[1].length,
      text: match[2],
      line: item.line,
      offset: item.offset + item.text.indexOf(match[1]),
    });
  }

  return outline;
}

const positionForOffset = (markdown, offset) => ({
  line: markdown.slice(0, offset).split("\n").length,
  offset,
});

const slugifyHeading = (text) =>
  text
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const maskFencedCode = (markdown) => {
  let inFence = false;
  let fenceChar = null;
  return markdown
    .split("\n")
    .map((line) => {
      const fence = line.match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        const char = fence[1][0];
        if (!inFence) {
          inFence = true;
          fenceChar = char;
        } else if (char === fenceChar) {
          inFence = false;
          fenceChar = null;
        }
        return " ".repeat(line.length);
      }
      return inFence ? " ".repeat(line.length) : line;
    })
    .join("\n");
};

export function analyzeMarkdown(markdown) {
  const diagnostics = [];
  const outline = getDocumentOutline(markdown);
  const h1s = outline.filter(({ depth }) => depth === 1);

  if (markdown.trim() && h1s.length === 0) {
    diagnostics.push({
      id: "heading-missing-h1",
      severity: "warning",
      category: "Structure",
      message: "Add one level-one document title.",
      line: 1,
      offset: 0,
      length: 0,
      fix: { label: "Add document title", start: 0, end: 0, text: "# Document title\n\n" },
    });
  }

  h1s.slice(1).forEach((heading) => {
    diagnostics.push({
      id: "heading-multiple-h1",
      severity: "warning",
      category: "Structure",
      message: "Use only one level-one title per document.",
      line: heading.line,
      offset: heading.offset,
      length: 1,
      fix: { label: "Change to level two", start: heading.offset, end: heading.offset + 1, text: "##" },
    });
  });

  outline.forEach((heading, index) => {
    const previous = outline[index - 1];
    if (!previous || heading.depth <= previous.depth + 1) return;
    const correctedDepth = previous.depth + 1;
    diagnostics.push({
      id: "heading-skipped-level",
      severity: "warning",
      category: "Structure",
      message: `Heading level jumps from H${previous.depth} to H${heading.depth}.`,
      line: heading.line,
      offset: heading.offset,
      length: heading.depth,
      fix: {
        label: `Change to H${correctedDepth}`,
        start: heading.offset,
        end: heading.offset + heading.depth,
        text: "#".repeat(correctedDepth),
      },
    });
  });

  const searchable = maskFencedCode(markdown);
  const linkPattern = /(!?)\[([^\]]*)\]\(([^)]*)\)/g;
  let match;
  while ((match = linkPattern.exec(searchable)) !== null) {
    const [fullMatch, imageMarker, label, rawTarget] = match;
    const offset = match.index;
    const target = rawTarget.trim().split(/\s+["']/)[0];
    const position = positionForOffset(markdown, offset);

    if (imageMarker) {
      if (!label.trim()) {
        diagnostics.push({
          id: "image-missing-alt",
          severity: "error",
          category: "Accessibility",
          message: "Image is missing alternative text.",
          ...position,
          length: fullMatch.length,
        });
      }
      continue;
    }

    if (/^(click here|here|read more|link)$/i.test(label.trim())) {
      diagnostics.push({
        id: "link-vague-text",
        severity: "warning",
        category: "Accessibility",
        message: `Link text “${label.trim()}” does not describe its destination.`,
        ...position,
        length: fullMatch.length,
      });
    }

    if (!target || /^(url|https?:\/\/example\.com\/?|#)$/i.test(target)) {
      diagnostics.push({
        id: "link-placeholder-target",
        severity: "warning",
        category: "Links",
        message: "Replace the placeholder link destination.",
        ...position,
        length: fullMatch.length,
      });
    }

    if (target.startsWith("#") && target.length > 1) {
      const fragments = new Set(outline.map(({ text }) => `#${slugifyHeading(text)}`));
      if (!fragments.has(target.toLowerCase())) {
        diagnostics.push({
          id: "link-missing-fragment",
          severity: "error",
          category: "Links",
          message: `No heading matches the fragment “${target}”.`,
          ...position,
          length: fullMatch.length,
        });
      }
    }
  }

  return diagnostics;
}

export function getLineDiff(current, previous) {
  const oldLines = previous.split("\n");
  const newLines = current.split("\n");
  const matrix = Array.from({ length: oldLines.length + 1 }, () =>
    Array(newLines.length + 1).fill(0)
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      matrix[oldIndex][newIndex] = oldLines[oldIndex] === newLines[newIndex]
        ? matrix[oldIndex + 1][newIndex + 1] + 1
        : Math.max(matrix[oldIndex + 1][newIndex], matrix[oldIndex][newIndex + 1]);
    }
  }

  const diff = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex < oldLines.length && newIndex < newLines.length && oldLines[oldIndex] === newLines[newIndex]) {
      diff.push({ type: "equal", text: oldLines[oldIndex], oldLine: oldIndex + 1, newLine: newIndex + 1 });
      oldIndex += 1;
      newIndex += 1;
    } else if (
      oldIndex < oldLines.length &&
      (newIndex >= newLines.length || matrix[oldIndex + 1][newIndex] >= matrix[oldIndex][newIndex + 1])
    ) {
      diff.push({ type: "remove", text: oldLines[oldIndex], oldLine: oldIndex + 1, newLine: null });
      oldIndex += 1;
    } else {
      diff.push({ type: "add", text: newLines[newIndex], oldLine: null, newLine: newIndex + 1 });
      newIndex += 1;
    }
  }

  return diff;
}

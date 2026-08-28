# Product roadmap

This roadmap tracks work that affects whether the editor feels predictable enough for daily use. Items are ordered by user impact, not implementation size.

## Next: make toolbar edits predictable

The current toolbar mutates the controlled textarea value directly. That works for simple selections, but it bypasses parts of the browser's native editing model and loses context when focus moves between the document and toolbar. These are product bugs and design gaps, not user mistakes.

### P0 — Restore undo and redo for toolbar changes

**Observed behavior:** Formatting applied with toolbar buttons cannot be reliably undone or redone with the browser or operating-system shortcuts.

**Why it matters:** A formatting command should behave like typing. Users need a safe way to reverse every change, especially when working in long documents.

**Acceptance criteria:**

- Every toolbar command creates one undoable editing transaction.
- Undo restores the previous Markdown, selection, and scroll position.
- Redo reapplies the command and restores the resulting selection.
- Typing and toolbar actions share one coherent history in Chrome, Firefox, and Safari.
- Automated coverage includes bold, inline code, and heading conversion.

### P0 — Preserve position when a toolbar button is used

**Observed behavior:** Clicking a toolbar button can jump the editor or browser to the top of the document when editing farther down the page.

**Likely cause:** Focus leaves the textarea for the toolbar, then selection restoration focuses the textarea without preserving its internal scroll position.

**Acceptance criteria:**

- Toolbar commands preserve the textarea's `scrollTop` and the surrounding page position.
- The transformed selection remains visible after the command.
- Mouse, keyboard, and touch activation produce the same result.
- The toolbar does not steal focus permanently from the editor.

### P0 — Make heading commands replace the current heading level

**Observed behavior:** Converting an H2 to H1, back to H2, and then to H3 can produce stacked markers such as:

```markdown
# ## ### What to extract
```

**Why it happens:** The command only removes heading markers when they are included in the selected text. Selecting the heading label without its prefix causes each command to prepend another marker.

**Acceptance criteria:**

- H1, H2, and H3 commands inspect the complete affected line, even when only the heading text is selected.
- Existing `#` markers are replaced with the requested level instead of being prepended.
- Applying the active heading level again does not add markers.
- Multi-line selections update each selected heading line predictably.
- The command preserves selection and scroll position.

### P1 — Make inline formatting commands idempotent

**Observed behavior:** Repeated bold, italic, link, or code commands can accumulate delimiter noise when the selection shifts inside or outside existing markup. One captured example produced a long mixture of `*` and `_` characters around partially formatted text.

This does not require a massive rule set. The toolbar needs a consistent edit-command model:

- Inspect delimiters immediately inside and outside the selection.
- Add a format when it is absent.
- Remove it when the full selection already has that format.
- Avoid nesting an identical format inside itself.
- Preserve meaningful mixed formatting rather than trying to rewrite arbitrary Markdown.

**Acceptance criteria:**

- Repeating the same command with an unchanged selection toggles cleanly between formatted and unformatted text.
- Selecting only the text inside existing delimiters does not create another identical wrapper.
- Commands do not consume adjacent punctuation or whitespace.
- Mixed or ambiguous selections produce a deterministic result covered by tests.
- Link and inline-code commands do not create invalid nested markup.

### P1 — Centralize toolbar operations as editor commands

The issues above share one architectural cause. Formatting, heading conversion, selection restoration, scroll restoration, and history should run through one command layer instead of separate string-splicing handlers.

A command should receive the document, selection, and scroll state, then return the next document and selection as one transaction. This gives each toolbar action the same rules and makes edge cases testable without adding scattered conditionals to the UI.

**Definition of done:**

- One command interface handles inline formatting and heading changes.
- Command tests cover collapsed cursors, partial selections, full-line selections, whitespace, existing markup, and repeated activation.
- The React component applies command results without duplicating transformation rules.
- Undo/redo, focus, selection, and scroll behavior are verified in a real browser.

## Later

- Add visible Undo and Redo buttons after the command history is reliable.
- Consider a small formatting-state indicator for the current selection.
- Add browser-level regression tests for long-document editing workflows.

## Completed

- Document quality checks and navigable outline
- Branded HTML and print/PDF publishing controls
- Local document workspace, review states, comments, and read-only sharing
- Simplified shared-document header with dark mode retained

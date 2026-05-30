---
title: Comprehensive Markdown Test Suite
description: A complete file containing various Markdown and GFM (GitHub Flavored Markdown) elements for testing parsers and renderers.
author: Gemini
date: 2026-05-28
---

# Markdown Element Test Suite

This document is designed to test the rendering capabilities of Markdown parsers. It includes standard Markdown elements, GitHub Flavored Markdown (GFM) extensions, and common HTML fallbacks.

---

## 1. Headings

# Heading 1 (H1)
## Heading 2 (H2)
### Heading 3 (H3)
#### Heading 4 (H4)
##### Heading 5 (H5)
###### Heading 6 (H6)

Alternative H1
=============

Alternative H2
-------------

---

## 2. Paragraphs and Line Breaks

This is a standard paragraph. It contains multiple sentences to demonstrate how text wraps when it reaches the edge of the container.
Markdown ignores single line breaks within a paragraph.

To create a line break, you need to add two spaces at the end of the line.
This line is immediately below the previous one.

<br>

You can also use the HTML `<br>` tag for line breaks.

---

## 3. Emphasis and Formatting

**Bold Text (Asterisks)**
__Bold Text (Underscores)__

*Italic Text (Asterisks)*
_Italic Text (Underscores)_

***Bold and Italic (Asterisks)***
___Bold and Italic (Underscores)___

~~Strikethrough (GFM)~~

This is some text with `inline code` embedded within it.

---

## 4. Blockquotes

> This is a standard blockquote.
> It can span multiple lines.
>
> You can also have multiple paragraphs within a blockquote by using an empty line with a `>` character.

Nested blockquotes:

> This is the first level of quoting.
> > This is nested blockquote.
> > > And a third level!

Blockquotes with other elements:

> - A list item in a blockquote
> - Another item
>
> **Bold text** and *italic text* inside.

---

## 5. Lists

### Unordered Lists (Different markers)

* Item 1 (Asterisk)
* Item 2
  * Nested Item 2.1
  * Nested Item 2.2
    * Deeply Nested 2.2.1

- Item 1 (Hyphen)
- Item 2

+ Item 1 (Plus)
+ Item 2

### Ordered Lists

1. First Item
2. Second Item
3. Third Item
   1. Nested Ordered Item 3.1
   2. Nested Ordered Item 3.2
      1. Deeply Nested 3.2.1
4. Fourth Item

*(Note: The actual numbers used in the Markdown source don't strictly matter for most parsers, they will render sequentially)*

1. Item A
1. Item B
1. Item C

### Mixed Lists

1. First Item
   - Unordered Nested
   - Unordered Nested
2. Second Item
   1. Ordered Nested

### Task Lists (GFM)

- [x] Completed task
- [ ] Incomplete task
- [ ] Another incomplete task
  - [x] Nested completed task

---

## 6. Code Blocks

### Indented Code Block

    def hello_world():
        print("Hello, World!")
        return True

### Fenced Code Blocks (No Language Specified)


```

```text
File created at /mnt/data/comprehensive-markdown-test-suite.md


```

Plain text code block.
No syntax highlighting applied here.

```

### Fenced Code Blocks (Syntax Highlighting)

```javascript
// JavaScript Example
function calculateSum(a, b) {
  return a + b;
}
const result = calculateSum(5, 10);
console.log(`The result is ${result}`);

```

```python
# Python Example
import os

class MarkdownTester:
    def __init__(self):
        self.status = "Ready"

    def run_tests(self):
        return [True, False, None]

```

```css
/* CSS Example */
body {
    background-color: #f4f4f4;
    color: #333333;
    font-family: 'Helvetica Neue', Arial, sans-serif;
}

```

```html
<div class="container">
    <h1>Hello World</h1>
    <p>This is a test.</p>
</div>

```

---

## 7. Horizontal Rules (Thematic Breaks)

Three or more asterisks:

---

## Three or more hyphens:

Three or more underscores:

---

---

## 8. Links

[Standard Inline Link](https://www.google.com)

[Link with Title](https://www.google.com)

[Reference-style Link](https://www.example.com)

[Another Reference-style Link with specific ID](https://www.google.com)

Autolinks:
[https://www.example.com](https://www.example.com)
[test@example.com](mailto:test@example.com)

Local / Anchor Links:
[Jump to Headings](#1-headings)

---

## 9. Images

Reference-style Image:


Linked Image:
[](https://www.google.com)

---

## 10. Tables (GFM)

| Default Alignment | Left Alignment | Center Alignment | Right Alignment |
| --- | --- | --- | --- |
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 | Row 1, Col 4 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 | Row 2, Col 4 |
| Cell with **Bold** | `Inline Code` | [Link](#) | ~~Strike~~ |

---

## 11. HTML Elements & Typographic Enhancements

Sometimes standard Markdown isn't enough, and parsers allow raw HTML.

Use `<kbd>` tags for keyboard shortcuts: Ctrl + Alt + Delete

Use `<sub>` for subscript (e.g., H2O).

Use `<sup>` for superscript (e.g., E = mc2).

Use `<mark>` to highlight text.

---

## 12. Footnotes (Extended Markdown)

Here is a simple footnote[^1].

Here is a longer footnote with multiple paragraphs[^bignote].

[^1]: This is the first footnote.
[^bignote]: Here's one with multiple blocks.

Subsequent paragraphs are indented to show that they belong to the previous footnote.

```python
print("Code in a footnote!")
```

---

## 13. Escaping Characters

You can use a backslash `\` to escape Markdown formatting characters:

*This should not be italicized*
# This should not be a heading
[This should not be a link](http://example.com)
`This should not be code`

---

## 14. Definition Lists (Extended Markdown / PHP Markdown Extra)

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

## Typographic Replacements

`...` becomes ellipsis: ...

`--` becomes en dash: --

`---` becomes em dash: ---

`(c)` becomes copyright: (c)

`(r)` becomes registered: (r)

`(tm)` becomes trademark: (tm)

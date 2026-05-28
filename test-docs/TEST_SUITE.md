markdown_content = """---
title: Comprehensive Markdown Test Suite
description: A complete file containing various Markdown and GFM (GitHub Flavored Markdown) elements for testing parsers and renderers.
author: Peter Benoit
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

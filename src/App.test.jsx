import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders the markdown textarea', () => {
  render(<App />);
  expect(screen.getByPlaceholderText(/Enter Markdown here/i)).toBeInTheDocument();
});

test('toolbar buttons are disabled when no text is selected', () => {
  render(<App />);
  const boldButton = screen.getByTitle('Bold');
  expect(boldButton).toBeDisabled();
});

test('typing in the textarea updates the preview', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '**hello**' } });
  const preview = document.querySelector('.markdown-content');
  expect(preview.innerHTML).toContain('<strong>');
});

test('fenced code blocks include syntax tokens and a readable language label', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, {
    target: { value: '```js\nconst greeting = "hello";\n```' },
  });

  const preview = document.querySelector('.markdown-content');
  expect(preview.querySelector('code')).toHaveClass('language-javascript');
  expect(preview.querySelector('.hljs-keyword')).toHaveTextContent('const');
  expect(preview.querySelector('.code-lang-label')).toHaveTextContent('JavaScript');
  expect(preview.querySelector('.code-line-count')).toHaveTextContent('1 line');
  expect(screen.getByLabelText('Copy code to clipboard')).toBeInTheDocument();
});

test('unknown fenced languages safely fall back to plain text', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, {
    target: { value: '```madeup\n<script>alert("nope")</script>\n```' },
  });

  const preview = document.querySelector('.markdown-content');
  expect(preview.querySelector('code')).toHaveClass('language-text');
  expect(preview.querySelector('.code-lang-label')).toHaveTextContent('madeup · plain text');
  expect(preview.querySelector('code').textContent).toBe('<script>alert("nope")</script>');
  expect(preview.querySelector('code script')).not.toBeInTheDocument();
});

test('unlabelled code-like blocks can detect a syntax language', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, {
    target: { value: '```\nfunction add(a, b) {\n  return a + b;\n}\n```' },
  });

  const preview = document.querySelector('.markdown-content');
  expect(preview.querySelector('code').className).not.toContain('language-text');
  expect(preview.querySelector('.code-lang-label')).toHaveTextContent('detected');
});

test('renders inline html-looking code inside ordered lists as code', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, {
    target: {
      value: [
        '### Clear wins (❌ Remove)',
        'The most impactful changes with zero risk:',
        '1. Headings (`<h1>`, `<h2>`, `<h3>`) — `block--full-width-banner`, `multistep-form-one`',
        '2. Layout / content `containers` — `block--cta-image`, `va-card`, `notification-block region`, `dialog-exit`, `signed-consent-preview activities`',
        '3. Native `<a href>` anchors — all 6 CTA links in legacy mvp templates',
        '4. Native `<button>` elements — `menu-account`, `timeout-notifier`',
      ].join('\n'),
    },
  });

  const preview = document.querySelector('.markdown-content');
  expect(preview.querySelector('ol')).toBeInTheDocument();
  expect(preview.querySelectorAll('ol h1, ol h2, ol h3')).toHaveLength(0);
  expect(preview.innerHTML).toContain('<code>&lt;h1&gt;</code>');
  expect(preview.innerHTML).toContain('<code>block--full-width-banner</code>');
});

test('dark mode toggle switches aria-label', () => {
  render(<App />);
  const toggle = screen.getByLabelText('Switch to dark mode');
  fireEvent.click(toggle);
  expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
});

test('bold button wraps selected plain text', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: 'hello world' } });
  textarea.setSelectionRange(6, 11); // "world"
  fireEvent.select(textarea);
  const boldButton = screen.getByTitle('Bold');
  fireEvent.click(boldButton);
  expect(textarea.value).toBe('hello **world**');
});

test('bold button unwraps already-bold selected text', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: 'hello **world**' } });
  textarea.setSelectionRange(6, 15); // "**world**"
  fireEvent.select(textarea);
  const boldButton = screen.getByTitle('Bold');
  fireEvent.click(boldButton);
  expect(textarea.value).toBe('hello world');
});

test('italic button wraps selected plain text', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: 'hello world' } });
  textarea.setSelectionRange(0, 5); // "hello"
  fireEvent.select(textarea);
  const italicButton = screen.getByTitle('Italic');
  fireEvent.click(italicButton);
  expect(textarea.value).toBe('_hello_ world');
});

test('italic button unwraps already-italic selected text', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '_hello_ world' } });
  textarea.setSelectionRange(0, 7); // "_hello_"
  fireEvent.select(textarea);
  const italicButton = screen.getByTitle('Italic');
  fireEvent.click(italicButton);
  expect(textarea.value).toBe('hello world');
});

test('inline code button toggles off when selection is already wrapped', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: 'use `foo` here' } });
  textarea.setSelectionRange(4, 9); // "`foo`"
  fireEvent.select(textarea);
  const codeButton = screen.getByTitle('Inline code');
  fireEvent.click(codeButton);
  expect(textarea.value).toBe('use foo here');
});

test('headings render with id attributes for anchor links', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '## Hello World\n\nSome text' } });
  const preview = document.querySelector('.markdown-content');
  const h2 = preview.querySelector('h2');
  expect(h2).toBeInTheDocument();
  expect(h2.getAttribute('id')).toBe('hello-world');
});

test('heading with special characters slugifies cleanly', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '### My Section (2024)!' } });
  const preview = document.querySelector('.markdown-content');
  const h3 = preview.querySelector('h3');
  expect(h3.getAttribute('id')).toBe('my-section-2024');
});

test('center-aligned table column gets align-center class', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, {
    target: {
      value: '| Left | Center | Right |\n|:---|:---:|---:|\n| a | b | c |',
    },
  });
  const preview = document.querySelector('.markdown-content');
  const cells = preview.querySelectorAll('td');
  expect(cells[1].className).toContain('align-center');
  expect(cells[2].className).toContain('align-right');
});

test('striped table toggle button toggles aria-pressed and class', () => {
  render(<App />);
  const toggleBtn = screen.getByTitle('Disable striped table rows');
  expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');
  const preview = document.querySelector('.markdown-content');
  expect(preview.className).toContain('table-striped');
  fireEvent.click(toggleBtn);
  expect(screen.getByTitle('Enable striped table rows').getAttribute('aria-pressed')).toBe('false');
  expect(document.querySelector('.markdown-content').className).not.toContain('table-striped');
});

test('superscript renders ^text^ as <sup>', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '19^th^' } });
  const preview = document.querySelector('.markdown-content');
  expect(preview.querySelector('sup')).toBeInTheDocument();
  expect(preview.querySelector('sup').textContent).toBe('th');
});

test('subscript renders ^^text^^ as <sub>', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: 'H^^2^^O' } });
  const preview = document.querySelector('.markdown-content');
  expect(preview.querySelector('sub')).toBeInTheDocument();
  expect(preview.querySelector('sub').textContent).toBe('2');
});

test('footnotes render [^1] references and a footnotes section', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, {
    target: {
      value: 'See note.[^1]\n\n[^1]: This is the footnote.',
    },
  });
  const preview = document.querySelector('.markdown-content');
  expect(preview.querySelector('sup a')).toBeInTheDocument();
  expect(preview.querySelector('.footnotes')).toBeInTheDocument();
  expect(preview.querySelector('.footnotes').textContent).toContain('This is the footnote.');
});

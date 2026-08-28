import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', window.location.pathname);
});

test('renders the markdown textarea', () => {
  render(<App />);
  expect(screen.getByPlaceholderText(/Enter Markdown here/i)).toBeInTheDocument();
});

test('links to the canonical GitHub repository', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/peterbenoit/markdown-editor',
  );
});

test('recovers the locally saved draft during initialization', () => {
  localStorage.setItem('markdown', '# Recovered draft');
  const { unmount } = render(<App />);
  expect(screen.getByPlaceholderText(/Enter Markdown here/i)).toHaveValue('# Recovered draft');
  unmount();
  localStorage.removeItem('markdown');
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

test('mermaid fences render as diagram containers instead of code blocks', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, {
    target: { value: '```mermaid\nflowchart LR\n  A --> B\n```' },
  });

  const diagram = document.querySelector('.mermaid-diagram');
  expect(diagram).toBeInTheDocument();
  expect(diagram).toHaveAttribute('data-mermaid-source');
  expect(document.querySelector('.code-block-wrapper')).not.toBeInTheDocument();
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

test('quality inspector reports issues and applies safe fixes', () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '## Overview\n\n#### Details' } });

  fireEvent.click(screen.getByLabelText('Open document insights'));
  expect(screen.getByRole('dialog', { name: 'Document insights' })).toBeInTheDocument();
  expect(screen.getByText('Add one level-one document title.')).toBeInTheDocument();
  expect(screen.getByText('Heading level jumps from H2 to H4.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Add document title' }));
  expect(textarea.value).toBe('# Document title\n\n## Overview\n\n#### Details');
});

test('outline items move focus to the selected heading', async () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '# Title\n\n## Second section' } });

  fireEvent.click(screen.getByLabelText('Open document insights'));
  fireEvent.click(screen.getByRole('tab', { name: 'Outline' }));
  fireEvent.click(screen.getByRole('button', { name: /Second section/ }));

  await waitFor(() => {
    const focusedEditor = screen.getByPlaceholderText(/Enter Markdown here/i);
    expect(focusedEditor).toHaveFocus();
    expect(focusedEditor.selectionStart).toBe(9);
  });
});

test('publishing studio controls branded contents and print output', async () => {
  const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  fireEvent.change(textarea, { target: { value: '# Brief\n\n## Scope\n\nDetails' } });

  fireEvent.click(screen.getByLabelText('Open publishing studio'));
  expect(screen.getByRole('dialog', { name: 'Publishing studio' })).toBeInTheDocument();
  expect(document.querySelector('.document-toc')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'Example Company' } });
  expect(document.querySelector('.preview-document')).toHaveAttribute('data-organization', 'Example Company');

  fireEvent.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
  await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1));
  printSpy.mockRestore();
});

test('workspace creates and switches between local documents', async () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText('Open team workspace'));
  expect(screen.getByRole('dialog', { name: 'Team workspace' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '+ New document' }));
  expect(screen.getByPlaceholderText(/Enter Markdown here/i)).toHaveValue('# Untitled document\n\nStart writing here.');

  fireEvent.click(screen.getByLabelText('Open team workspace'));
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Markdown Editor/i })).toHaveLength(1);
});

test('workspace supports review status and anchored comments', async () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/Enter Markdown here/i);
  textarea.setSelectionRange(0, 17);
  fireEvent.select(textarea);
  fireEvent.click(screen.getByLabelText('Open team workspace'));

  fireEvent.change(screen.getByLabelText('Document status'), { target: { value: 'in-review' } });
  expect(screen.getByLabelText('Document status')).toHaveValue('in-review');
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Pat' } });
  fireEvent.change(screen.getByLabelText('Comment'), { target: { value: 'Ready for stakeholder review.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));

  expect(screen.getByText('Ready for stakeholder review.')).toBeInTheDocument();
  expect(screen.getAllByText(/# Markdown Editor/).length).toBeGreaterThan(0);
});

test('workspace copies a portable read-only share link', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<App />);
  fireEvent.click(screen.getByLabelText('Open team workspace'));
  fireEvent.click(screen.getByRole('button', { name: 'Copy read-only share link' }));

  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  expect(writeText.mock.calls[0][0]).toContain('#share=');
  expect(await screen.findByRole('button', { name: 'Read-only link copied' })).toBeInTheDocument();
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
  const h2 = preview.querySelector('h2[id]');
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

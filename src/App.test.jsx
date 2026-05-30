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

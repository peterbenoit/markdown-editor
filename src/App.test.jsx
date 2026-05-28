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

test('dark mode toggle switches label', () => {
  render(<App />);
  const toggle = screen.getByLabelText('Toggle dark mode');
  expect(toggle).toHaveTextContent('Dark');
  fireEvent.click(toggle);
  expect(toggle).toHaveTextContent('Light');
});


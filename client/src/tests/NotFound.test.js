import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../pages/NotFound';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('NotFound page', () => {
  test('renders 404 message', () => {
    renderWithRouter(<NotFound />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });

  test('has link back to home', () => {
    renderWithRouter(<NotFound />);
    const link = screen.getByText(/返回首页/);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });
});

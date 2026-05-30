import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pagination from '../components/Pagination';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Pagination', () => {
  test('renders page buttons', () => {
    renderWithRouter(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('disables prev buttons on page 1', () => {
    renderWithRouter(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled(); // 首页
    expect(buttons[1]).toBeDisabled(); // 上一页
  });

  test('disables next buttons on last page', () => {
    renderWithRouter(<Pagination page={5} totalPages={5} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const lastBtn = buttons[buttons.length - 1];
    expect(lastBtn).toBeDisabled();
  });

  test('calls onPageChange when clicking a page', () => {
    const handleChange = jest.fn();
    renderWithRouter(<Pagination page={1} totalPages={5} onPageChange={handleChange} />);
    fireEvent.click(screen.getByText('2'));
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  test('shows ellipsis for many pages', () => {
    renderWithRouter(<Pagination page={1} totalPages={20} onPageChange={() => {}} />);
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });
});

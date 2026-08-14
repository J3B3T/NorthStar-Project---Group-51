import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders Processing status correctly', () => {
    render(<StatusBadge status="Processing" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByLabelText('Order status: Processing')).toBeInTheDocument();
  });

  it('renders Delivered status correctly', () => {
    render(<StatusBadge status="Delivered" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('applies small size class when size is sm', () => {
    render(<StatusBadge status="Shipped" size="sm" />);
    const badge = screen.getByText('Shipped');
    expect(badge).toHaveClass('text-xs');
  });
});

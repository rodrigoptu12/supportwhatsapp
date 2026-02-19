import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner with default class', () => {
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('accepts custom className', () => {
    const { container } = render(<LoadingSpinner className="mt-4" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('mt-4');
  });

  it('accepts custom size', () => {
    const { container } = render(<LoadingSpinner size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

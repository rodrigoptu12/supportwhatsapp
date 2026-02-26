import { render, screen } from '@testing-library/react';
import Metrics from '../Metrics';

describe('Metrics page', () => {
  it('renders title and placeholder message', () => {
    render(<Metrics />);
    expect(screen.getByText('Métricas')).toBeInTheDocument();
    expect(screen.getByText(/relatórios detalhados de atendimento/)).toBeInTheDocument();
  });
});

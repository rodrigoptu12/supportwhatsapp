import { render, screen } from '@testing-library/react';
import Metrics from '../Metrics';

describe('Metrics page', () => {
  it('renders title and placeholder message', () => {
    render(<Metrics />);
    expect(screen.getByText('Metricas')).toBeInTheDocument();
    expect(screen.getByText(/Metricas de atendimento serao implementadas aqui/)).toBeInTheDocument();
  });
});

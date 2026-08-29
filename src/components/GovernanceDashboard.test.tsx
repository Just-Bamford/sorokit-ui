import { render, screen } from '@testing-library/react';

import GovernanceDashboard from './GovernanceDashboard';

test('renders dashboard', () => {
  render(<GovernanceDashboard />);
  expect(screen.getByText(/Governance Voting Dashboard/i)).toBeInTheDocument();
});

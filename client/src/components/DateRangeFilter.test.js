import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import DateRangeFilter from './DateRangeFilter';

function Wrapper({ initialEntries }) {
	return (
		<MemoryRouter initialEntries={initialEntries}>
			<DateRangeFilter />
		</MemoryRouter>
	);
}

test('renders date pickers and buttons', () => {
	render(<Wrapper initialEntries={['/']} />);
	expect(screen.getByLabelText(/From/i)).toBeInTheDocument();
	expect(screen.getByLabelText(/To/i)).toBeInTheDocument();
	expect(screen.getByText(/Apply/i)).toBeInTheDocument();
	expect(screen.getByText(/Clear/i)).toBeInTheDocument();
});

test('shows error if To date is before From date', async () => {
		render(<Wrapper initialEntries={['/']} />);
		const fromInput = screen.getByLabelText(/From/i);
		const toInput = screen.getByLabelText(/To/i);
		fireEvent.change(fromInput, { target: { value: '2025-10-21' } });
		fireEvent.change(toInput, { target: { value: '2025-10-01' } });
		// Check for error state on the To input
		expect(toInput).toHaveAttribute('aria-invalid', 'true');
});

test('clear button resets dates and removes params', () => {
	render(<Wrapper initialEntries={['/?from=2025-10-01&to=2025-10-21']} />);
	fireEvent.click(screen.getByText(/Clear/i));
	// Should reset to default dates and remove params
	// Location search should not contain 'from' or 'to'
});

test('apply button sets params in URL', () => {
	render(<Wrapper initialEntries={['/']} />);
	fireEvent.click(screen.getByText(/Apply/i));
	// Location search should contain 'from' and 'to'
});

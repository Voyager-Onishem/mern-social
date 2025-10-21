import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MediaTypeFilter from './MediaTypeFilter';

const counts = { text: 5, image: 10, video: 2, audio: 1, gif: 3 };

test('renders all media type chips with counts', () => {
	render(<MediaTypeFilter counts={counts} />);
	expect(screen.getByText(/Text \(5\)/)).toBeInTheDocument();
	expect(screen.getByText(/Image \(10\)/)).toBeInTheDocument();
	expect(screen.getByText(/Video \(2\)/)).toBeInTheDocument();
	expect(screen.getByText(/Audio \(1\)/)).toBeInTheDocument();
	expect(screen.getByText(/GIF \(3\)/)).toBeInTheDocument();
});

test('select none and select all buttons work', () => {
		render(<MediaTypeFilter counts={counts} />);
		fireEvent.click(screen.getByText(/Select None/i));
		const chipLabel = screen.getByText(/Text \(5\)/);
		const chipRoot = chipLabel.closest('.MuiChip-root');
		expect(chipRoot).toHaveClass('MuiChip-outlined');
		fireEvent.click(screen.getByText(/Select All/i));
		expect(chipRoot).toHaveClass('MuiChip-filled');
});

test('toggle chip selection', () => {
		render(<MediaTypeFilter counts={counts} />);
		const chipLabel = screen.getByText(/Video \(2\)/);
		const chipRoot = chipLabel.closest('.MuiChip-root');
		fireEvent.click(chipLabel);
		expect(chipRoot).toHaveClass('MuiChip-outlined');
		fireEvent.click(chipLabel);
		expect(chipRoot).toHaveClass('MuiChip-filled');
});

test('persists filter state in localStorage', () => {
	render(<MediaTypeFilter counts={counts} />);
	fireEvent.click(screen.getByText(/Select None/i));
	expect(JSON.parse(localStorage.getItem('mediaTypeFilter'))).toEqual([]);
	fireEvent.click(screen.getByText(/Select All/i));
	expect(JSON.parse(localStorage.getItem('mediaTypeFilter'))).toEqual([
		'text', 'image', 'video', 'audio', 'gif'
	]);
});

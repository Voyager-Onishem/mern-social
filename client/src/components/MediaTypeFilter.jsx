import React, { useState, useEffect } from 'react';
import { Chip, Box, Typography, Button } from '@mui/material';

const MEDIA_TYPES = [
	{ key: 'text', label: 'Text' },
	{ key: 'image', label: 'Image' },
	{ key: 'video', label: 'Video' },
	{ key: 'audio', label: 'Audio' },
	{ key: 'gif', label: 'GIF' },
];

const defaultSelected = MEDIA_TYPES.map(mt => mt.key);

const MediaTypeFilter = ({ counts = {}, onChange }) => {
	const [selected, setSelected] = useState(defaultSelected);

	useEffect(() => {
		if (onChange) onChange(selected);
		// Persist filter state in localStorage
		localStorage.setItem('mediaTypeFilter', JSON.stringify(selected));
	}, [selected, onChange]);

	useEffect(() => {
		// Load persisted filter state
		const persisted = localStorage.getItem('mediaTypeFilter');
		if (persisted) setSelected(JSON.parse(persisted));
	}, []);

	const handleToggle = (type) => {
		setSelected(sel =>
			sel.includes(type)
				? sel.filter(t => t !== type)
				: [...sel, type]
		);
	};

	const handleSelectAll = () => setSelected(defaultSelected);
	const handleSelectNone = () => setSelected([]);

	return (
		<Box display="flex" flexDirection="column" gap={2}>
			<Typography variant="subtitle1">Media Type</Typography>
			<Box display="flex" gap={1} flexWrap="wrap">
				{MEDIA_TYPES.map(mt => (
					<Chip
						key={mt.key}
						label={`${mt.label}${counts[mt.key] !== undefined ? ` (${counts[mt.key]})` : ''}`}
						color={selected.includes(mt.key) ? 'primary' : 'default'}
						onClick={() => handleToggle(mt.key)}
						variant={selected.includes(mt.key) ? 'filled' : 'outlined'}
					/>
				))}
			</Box>
			<Box display="flex" gap={1}>
				<Button size="small" onClick={handleSelectAll}>Select All</Button>
				<Button size="small" onClick={handleSelectNone}>Select None</Button>
			</Box>
		</Box>
	);
};

export default MediaTypeFilter;

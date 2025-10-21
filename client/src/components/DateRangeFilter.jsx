import React, { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useLocation, useNavigate } from 'react-router-dom';

function getDefaultDates() {
	const to = new Date();
	const from = new Date();
	from.setDate(to.getDate() - 30);
	return { from, to };
}

function parseQuery(search) {
	const params = new URLSearchParams(search);
	return {
		from: params.get('from') ? new Date(params.get('from')) : null,
		to: params.get('to') ? new Date(params.get('to')) : null,
	};
}

const DateRangeFilter = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const isMobile = useMediaQuery('(max-width:600px)');
	const queryDates = parseQuery(location.search);
	const defaults = getDefaultDates();
	const [fromDate, setFromDate] = useState(queryDates.from || defaults.from);
	const [toDate, setToDate] = useState(queryDates.to || defaults.to);
	const [error, setError] = useState('');

	useEffect(() => {
		if (fromDate && toDate && toDate < fromDate) {
			setError('To date must be after From date');
		} else {
			setError('');
		}
	}, [fromDate, toDate]);

	const handleApply = () => {
		if (error) return;
		const params = new URLSearchParams(location.search);
		params.set('from', fromDate.toISOString());
		params.set('to', toDate.toISOString());
		navigate({ search: params.toString() });
	};

	const handleClear = () => {
		setFromDate(defaults.from);
		setToDate(defaults.to);
		const params = new URLSearchParams(location.search);
		params.delete('from');
		params.delete('to');
		navigate({ search: params.toString() });
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns}>
			<Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems="center" gap={2}>
				<DatePicker
					label="From"
					value={fromDate}
					onChange={setFromDate}
					renderInput={(params) => <TextField {...params} size={isMobile ? 'small' : 'medium'} />}
				/>
				<DatePicker
					label="To"
					value={toDate}
					onChange={setToDate}
					renderInput={(params) => <TextField {...params} size={isMobile ? 'small' : 'medium'} />}
				/>
				<Button variant="contained" onClick={handleApply} disabled={!!error}>Apply</Button>
				<Button variant="outlined" onClick={handleClear}>Clear</Button>
			</Box>
			{error && <Box color="error.main" mt={1}>{error}</Box>}
		</LocalizationProvider>
	);
};

export default DateRangeFilter;

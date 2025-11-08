module.exports = {
	transformIgnorePatterns: [
		'/node_modules/(?!date-fns)/'
	],
	testEnvironment: 'jsdom',
	testTimeout: 10000, // 10 seconds timeout per test
};

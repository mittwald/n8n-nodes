const config = {
	test: {
		include: ['test/integration/**/*.test.ts'],
		environment: 'node',
		isolate: false,
		fileParallelism: false,
		maxWorkers: 1,
		maxConcurrency: 1,
	},
};

export default config;

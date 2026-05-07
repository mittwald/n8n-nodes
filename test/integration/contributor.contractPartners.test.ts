/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Contributor / List Contract Partners (integration)', () => {
	testcase('fetches contract partners for a contributor', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Contributor',
			operation: 'List Contract Partners',
			parameters: {
				organisation: {
					mode: 'id',
					value: 'self',
				},
			},
		});

		expect(Array.isArray(result.items)).toBe(true);
	});
});

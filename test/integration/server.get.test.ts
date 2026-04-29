/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Server / Get (integration)', () => {
	testcase('fetches a single server by id', async ({ runOperation, env }) => {
		const result = await runOperation({
			resource: 'Server',
			operation: 'Get',
			parameters: {
				server: {
					mode: 'id',
					value: env.testServerId,
				},
			},
		});

		expect(result.items.length).toBe(1);
		expect(result.firstItem.json.id).toBe(env.testServerId);
	});
});

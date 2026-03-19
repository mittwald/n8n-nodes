/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { hasIntegrationEnv } from './helpers';
import { testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

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

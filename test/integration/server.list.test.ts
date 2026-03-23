/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, readOptionalString, testcase } from './testcase';

integrationDescribe('Server / List (integration)', () => {
	testcase('lists servers and includes the configured test server', async ({ runOperation, env }) => {
		const result = await runOperation({
			resource: 'Server',
			operation: 'List',
		});

		expect(result.items.length).toBeGreaterThan(0);
		const serverIds = result.items
			.map((item) => readOptionalString(item.json, 'id'))
			.filter((id): id is string => Boolean(id));
		expect(serverIds).toContain(env.testServerId);
	});
});

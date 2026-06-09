/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Contributor / List Contract Partners (integration)', () => {
	testcase('fetches contract partners for a contributor', async (context) => {
		const server = await context.mittwaldApi.project.getServer({
			serverId: context.env.testServerId,
		});

		if (server.status !== 200) {
			throw new Error(`Failed to fetch test server: expected status 200, got ${server.status}`);
		}

		const organisationId = server.data.customerId;

		const result = await context.runOperation({
			resource: 'Contributor',
			operation: 'List Contract Partners',
			parameters: {
				organisation: {
					mode: 'id',
					value: organisationId,
				},
			},
			allowEmptyItems: true,
		});

		expect(Array.isArray(result.items)).toBe(true);
	});
});

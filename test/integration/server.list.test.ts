/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { hasIntegrationEnv } from './helpers';
import { testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

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

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
	const value = source[key];
	return typeof value === 'string' ? value : undefined;
}

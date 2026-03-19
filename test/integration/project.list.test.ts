/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { hasIntegrationEnv } from './helpers';
import { testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

integrationDescribe('Project / List (integration)', () => {
	testcase('lists projects', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Project',
			operation: 'List',
		});

		expect(Array.isArray(result.items)).toBe(true);
	});
});

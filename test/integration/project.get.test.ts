/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { hasIntegrationEnv, runId } from './helpers';
import { testcase } from './testcase';

const integrationDescribe = hasIntegrationEnv() ? describe : describe.skip;

integrationDescribe('Project / Get (integration)', () => {
	testcase('creates a project and fetches it via Get', async (context) => {
		const description = `it-${runId('project-get')}`;

		const created = await context.runOperation({
			resource: 'Project',
			operation: 'Create',
			parameters: {
				server: {
					mode: 'id',
					value: context.env.testServerId,
				},
				description,
			},
		});

		const projectId = readRequiredString(created.firstItem.json, 'id');
		context.teardown(async () => {
			await context.mittwaldApi.deleteProject(projectId);
		});

		const fetched = await context.runOperation({
			resource: 'Project',
			operation: 'Get',
			parameters: {
				project: {
					mode: 'id',
					value: projectId,
				},
			},
		});

		expect(fetched.firstItem.json.id).toBe(projectId);
	});
});

function readRequiredString(source: Record<string, unknown>, key: string): string {
	const value = source[key];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}

	throw new Error(`Expected property "${key}" to be a non-empty string`);
}

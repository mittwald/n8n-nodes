/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect } from 'vitest';
import { runId } from './helpers';
import { readRequiredString, testcase } from './testcase';

describe('Project / Create (integration)', () => {
	testcase('creates a project via n8n and verifies it via mittwald API', async (context) => {
		const description = `it-${runId('project')}`;
		const execution = await context.runOperation({
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

		const projectId = readRequiredString(execution.firstItem.json, 'id');

		context.teardown(async () => {
			await context.mittwaldApi.deleteProject(projectId);
		});

		const project = await context.mittwaldApi.getProject(projectId);
		expect(project.id).toBe(projectId);
		expect(project.description).toBe(description);
	});
});

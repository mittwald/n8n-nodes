/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { createMittwaldWorkflow, nodeIdReference } from './helpers';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

integrationDescribe('Workflow / Multi-Node (example)', () => {
	testcase(
		'creates a project and then lists SSH users in the same workflow',
		async (context) => {
			const createProjectStep = {
				name: 'Create Project',
				resource: 'Project',
				operation: 'Create',
				parameters: {
					server: {
						mode: 'id',
						value: context.env.testServerId,
					},
					description: `it-${Date.now()}-workflow-project`,
				},
			} as const;
			const listSshUsersStep = {
				name: 'List SSH Users',
				resource: 'Project',
				operation: 'List SSH Users',
				parameters: {
					project: nodeIdReference(createProjectStep.name),
				},
			} as const;

			const result = await context.runWorkflow({
				workflow: createMittwaldWorkflow(context.env, [createProjectStep, listSshUsersStep]),
			});

			const createItems = result.getNodeItems(createProjectStep.name, { allowEmpty: false });
			const projectId = readRequiredString(createItems[0]?.json ?? {}, 'id');

			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			const listItems = result.getNodeItems(listSshUsersStep.name);
			expect(Array.isArray(listItems)).toBe(true);
		},
		30_000,
	);
});

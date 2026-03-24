/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Workflow / Multi-Node (example)', () => {
	testcase(
		'creates a project and then lists SSH users in the same workflow',
		async (context) => {
			const result = await context
				.scenario('Example multi-node workflow')
				.step({
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
				})
				.step({
					name: 'List SSH Users',
					resource: 'Project',
					operation: 'List SSH Users',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.run();

			const projectId = result.step('Create Project').requireString('id');

			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			expect(Array.isArray(result.step('List SSH Users').items())).toBe(true);
		},
		30_000,
	);
});

/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { MittwaldAPIV2Client } from '@mittwald/api-client';

integrationDescribe('Project / Lifecycle (integration)', () => {
	testcase(
		'creates, lists, gets, and deletes a project in one workflow',
		async (context) => {
			const description = `it-${runId('project-flow')}`;

			context.teardown(async () => {
				const response = await context.mittwaldApi.project.listProjects();

				if (response.status !== 200) {
					throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
				}

				const projects = response.data;

				const project = projects.find((entry) => entry.description === description);
				if (project) {
					await context.mittwaldApi.project.deleteProject({ projectId: project.id });
				}
			});

			const result = await context
				.scenario('Project lifecycle')
				.step({
					name: 'Create Project',
					resource: 'Project',
					operation: 'Create',
					parameters: {
						server: {
							mode: 'id',
							value: context.env.testServerId,
						},
						description,
					},
				})
				.step({
					name: 'List Projects',
					resource: 'Project',
					operation: 'List',
				})
				.step({
					name: 'Get Project',
					resource: 'Project',
					operation: 'Get',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.step({
					name: 'Delete Project',
					resource: 'Project',
					operation: 'Delete',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.run();

			const projectId = result.step('Create Project').requireString('id');

			expect(result.step('List Projects').stringValues('id')).toContain(projectId);
			expect(result.step('Get Project').requireString('id')).toBe(projectId);
			expect(result.step('Get Project').requireString('description')).toBe(description);

			await expectProjectToBeInaccessible(context, projectId);
		},
		10_000,
	);
});

async function expectProjectToBeInaccessible(
	context: {
		mittwaldApi: MittwaldAPIV2Client;
	},
	projectId: string,
): Promise<void> {
	const response = await context.mittwaldApi.project.getProject({ projectId });
	if (response.status === 403) {
		return;
	}
	throw new Error(`Expected deleted project "${projectId}" to be inaccessible`);
}

/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Project / Lifecycle (integration)', () => {
	testcase('creates, lists, gets, and deletes a project in one workflow', async (context) => {
		const description = `it-${runId('project-flow')}`;

		context.teardown(async () => {
			const projects = await context.mittwaldApi.listProjects();
			const project = projects.find((entry) => entry.description === description);
			if (project) {
				await context.mittwaldApi.deleteProject(project.id);
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
	});
});

async function expectProjectToBeInaccessible(
	context: {
		mittwaldApi: {
			getProject: (projectId: string) => Promise<unknown>;
		};
	},
	projectId: string,
): Promise<void> {
	try {
		await context.mittwaldApi.getProject(projectId);
	} catch (error) {
		const statusCode = (error as { statusCode?: unknown }).statusCode;
		if (statusCode === 403 || statusCode === 404) {
			return;
		}
		throw error;
	}

	throw new Error(`Expected deleted project "${projectId}" to be inaccessible`);
}

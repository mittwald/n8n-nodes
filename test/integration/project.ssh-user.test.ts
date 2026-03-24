/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Project / SSH User (integration)', () => {
	testcase('creates and deletes an SSH user', async (context) => {
		const projectDescription = `it-${runId('ssh-project')}`;
		const userDescription = `it-${runId('ssh-user')}`;
		const password = `S3cure!${runId('pw')}`;

		context.teardown(async () => {
			const projects = await context.mittwaldApi.listProjects();
			const project = projects.find((entry) => entry.description === projectDescription);
			if (project) {
				await context.mittwaldApi.deleteProject(project.id);
			}
		});

		const result = await context
			.scenario('SSH user lifecycle')
			.step({
				name: 'Create Project',
				resource: 'Project',
				operation: 'Create',
				parameters: {
					server: {
						mode: 'id',
						value: context.env.testServerId,
					},
					description: projectDescription,
				},
			})
			.step({
				name: 'Create SSH User',
				resource: 'Project',
				operation: 'Create SSH User',
				parameters: {
					project: fromStep('Create Project'),
					description: userDescription,
					password,
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
			.step({
				name: 'Delete SSH User',
				resource: 'Project',
				operation: 'Delete SSH User',
				parameters: {
					sshUserId: fromStep('Create SSH User'),
				},
			})
			.run();

		const projectId = result.step('Create Project').requireString('id');
		const sshUserId = result.step('Create SSH User').requireString('id');
		expect(result.step('Create SSH User').requireString('projectId')).toBe(projectId);
		expect(result.step('List SSH Users').stringValues('id')).toContain(sshUserId);
	});
});

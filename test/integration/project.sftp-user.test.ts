/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Project / SFTP User (integration)', () => {
	testcase('creates and deletes an SFTP user', async (context) => {
		const projectDescription = `it-${runId('sftp-project')}`;
		const userDescription = `it-${runId('sftp-user')}`;
		const password = `S3cure!${runId('pw')}`;

		context.teardown(async () => {
			const projects = await context.mittwaldApi.listProjects();
			const project = projects.find((entry) => entry.description === projectDescription);
			if (project) {
				await context.mittwaldApi.deleteProject(project.id);
			}
		});

		const result = await context
			.scenario('SFTP user lifecycle')
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
				name: 'Create SFTP User',
				resource: 'Project',
				operation: 'Create SFTP User',
				parameters: {
					project: fromStep('Create Project'),
					description: userDescription,
					password,
					accessLevel: 'read',
					directories: '/html',
				},
			})
			.step({
				name: 'List SFTP Users',
				resource: 'Project',
				operation: 'List SFTP Users',
				parameters: {
					project: fromStep('Create Project'),
				},
			})
			.step({
				name: 'Delete SFTP User',
				resource: 'Project',
				operation: 'Delete SFTP User',
				parameters: {
					sftpUserId: fromStep('Create SFTP User'),
				},
			})
			.run();

		const projectId = result.step('Create Project').requireString('id');
		const sftpUserId = result.step('Create SFTP User').requireString('id');
		expect(result.step('Create SFTP User').requireString('projectId')).toBe(projectId);
		expect(result.step('List SFTP Users').stringValues('id')).toContain(sftpUserId);
	});
});

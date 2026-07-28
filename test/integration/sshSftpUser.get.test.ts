/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('SSH/SFTP User / Get (integration)', () => {
	testcase('creates and gets an SSH user', async (context) => {
		const projectDescription = `it-${runId('ssh-get-project')}`;
		const userDescription = `it-${runId('ssh-get-user')}`;
		const password = `S3cure!${runId('pw')}`;

		context.teardown(async () => {
			const response = await context.mittwaldApi.project.listProjects();

			if (response.status !== 200) {
				throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
			}

			const projects = response.data;

			const project = projects.find(
				(entry: { description?: string; id: string }) => entry.description === projectDescription,
			);
			if (project) {
				await context.mittwaldApi.project.deleteProject({ projectId: project.id });
			}
		});

		const result = await context
			.scenario('SSH user get')
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
				resource: 'SSH/SFTP User',
				operation: 'Create SSH User',
				parameters: {
					project: fromStep('Create Project'),
					description: userDescription,
					password,
				},
			})
			.step({
				name: 'Get SSH User',
				resource: 'SSH/SFTP User',
				operation: 'Get SSH User',
				parameters: {
					sshUserId: fromStep('Create SSH User').value,
				},
			})
			.run();

		const sshUserId = result.step('Create SSH User').requireString('id');
		expect(result.step('Get SSH User').requireString('id')).toBe(sshUserId);
	});

	testcase('creates and gets an SFTP user', async (context) => {
		const projectDescription = `it-${runId('sftp-get-project')}`;
		const userDescription = `it-${runId('sftp-get-user')}`;
		const password = `S3cure!${runId('pw')}`;

		context.teardown(async () => {
			const response = await context.mittwaldApi.project.listProjects();

			if (response.status !== 200) {
				throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
			}

			const projects = response.data;

			const project = projects.find(
				(entry: { description?: string; id: string }) => entry.description === projectDescription,
			);
			if (project) {
				await context.mittwaldApi.project.deleteProject({ projectId: project.id });
			}
		});

		const result = await context
			.scenario('SFTP user get')
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
				resource: 'SSH/SFTP User',
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
				name: 'Get SFTP User',
				resource: 'SSH/SFTP User',
				operation: 'Get SFTP User',
				parameters: {
					sftpUserId: fromStep('Create SFTP User').value,
				},
			})
			.run();

		const sftpUserId = result.step('Create SFTP User').requireString('id');
		expect(result.step('Get SFTP User').requireString('id')).toBe(sftpUserId);
	});
});

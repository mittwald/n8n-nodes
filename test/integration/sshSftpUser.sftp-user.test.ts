/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('SSH/SFTP User / SFTP (integration)', () => {
	testcase('creates and deletes an SFTP user', async (context) => {
		const projectDescription = `it-${runId('sftp-project')}`;
		const userDescription = `it-${runId('sftp-user')}`;
		const password = `S3cure!${runId('pw')}`;

		context.teardown(async () => {
			const response = await context.mittwaldApi.project.listProjects();

			if (response.status !== 200) {
				throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
			}

			const projects = response.data;

			const project = projects.find((entry) => entry.description === projectDescription);
			if (project) {
				await context.mittwaldApi.project.deleteProject({ projectId: project.id });
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
				name: 'Create SFTP User With Full Access',
				resource: 'SSH/SFTP User',
				operation: 'Create SFTP User',
				parameters: {
					project: fromStep('Create Project'),
					description: `${userDescription}-all`,
					password,
					accessLevel: 'read',
					allDirectories: true,
				},
			})
			.step({
				name: 'List SFTP Users',
				resource: 'SSH/SFTP User',
				operation: 'List SFTP Users',
				parameters: {
					project: fromStep('Create Project'),
				},
			})
			.step({
				name: 'Delete SFTP User',
				resource: 'SSH/SFTP User',
				operation: 'Delete SFTP User',
				parameters: {
					sftpUserId: fromStep('Create SFTP User').value,
				},
			})
			.step({
				name: 'Delete SFTP User With Full Access',
				resource: 'SSH/SFTP User',
				operation: 'Delete SFTP User',
				parameters: {
					sftpUserId: fromStep('Create SFTP User With Full Access').value,
				},
			})
			.run();

		const projectId = result.step('Create Project').requireString('id');
		const sftpUserId = result.step('Create SFTP User').requireString('id');
		const fullAccessUserId = result.step('Create SFTP User With Full Access').requireString('id');
		expect(result.step('Create SFTP User').requireString('projectId')).toBe(projectId);

		expect(result.step('List SFTP Users').stringValues('id')).toContain(sftpUserId);
		expect(result.step('List SFTP Users').stringValues('id')).toContain(fullAccessUserId);

		// "Access to All Directories" has to reach the API as the project root. Read back from the
		// list instead of Get SFTP User: right after creation the API still answers a lookup by id
		// with "access denied; verdict: abstain".
		const fullAccessUser = result
			.step('List SFTP Users')
			.items()
			.find((item) => item.json.id === fullAccessUserId);
		expect(fullAccessUser?.json.directories).toEqual(['/']);
	});
});

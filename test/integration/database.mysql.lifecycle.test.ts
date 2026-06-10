/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Database / MySQL Lifecycle (integration)', () => {
	testcase(
		'creates, lists, gets, and deletes a MySQL database in one workflow',
		async (context) => {
			const projectDescription = `it-${runId('mysql-project')}`;
			const dbDescription = `it-${runId('mysql-db')}`;
			const password = `S3cure!${runId('pw')}`;

			context.teardown(async () => {
				const response = await context.mittwaldApi.project.listProjects();
				if (response.status !== 200) {
					throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
				}
				const project = response.data.find((entry) => entry.description === projectDescription);
				if (project) {
					await context.mittwaldApi.project.deleteProject({ projectId: project.id });
				}
			});

			const result = await context
				.scenario('MySQL lifecycle')
				.step({
					name: 'Create Project',
					resource: 'Project',
					operation: 'Create',
					parameters: {
						server: { mode: 'id', value: context.env.testServerId },
						description: projectDescription,
					},
				})
				.step({
					name: 'Create MySQL Database',
					resource: 'Database',
					operation: 'Create MySQL Database',
					parameters: {
						project: fromStep('Create Project'),
						description: dbDescription,
						version: { mode: 'id', value: '8.0' },
						characterSet: 'utf8mb4',
						collation: 'utf8mb4_unicode_ci',
						userPassword: password,
						userAccessLevel: 'full',
						userExternalAccess: false,
						userDescription: dbDescription,
					},
				})
				.step({
					name: 'List MySQL Databases',
					resource: 'Database',
					operation: 'List MySQL Databases',
					parameters: { project: fromStep('Create Project') },
				})
				.step({
					name: 'Get MySQL Database',
					resource: 'Database',
					operation: 'Get MySQL Database',
					parameters: { mysqlDatabaseId: fromStep('Create MySQL Database').value },
				})
				.step({
					name: 'Copy MySQL Database',
					resource: 'Database',
					operation: 'Copy MySQL Database',
					parameters: {
						mysqlDatabaseId: fromStep('Create MySQL Database').value,
						description: `${dbDescription}-copy`,
						userPassword: password,
						userExternalAccess: false,
					},
				})
				.step({
					name: 'List After Copy',
					resource: 'Database',
					operation: 'List MySQL Databases',
					parameters: { project: fromStep('Create Project') },
				})
				.step({
					name: 'Delete MySQL Database',
					resource: 'Database',
					operation: 'Delete MySQL Database',
					parameters: { mysqlDatabaseId: fromStep('Create MySQL Database').value },
				})
				.run();

			const dbId = result.step('Create MySQL Database').requireString('id');
			const copyId = result.step('Copy MySQL Database').requireString('id');

			expect(result.step('List MySQL Databases').stringValues('id')).toContain(dbId);
			expect(result.step('Get MySQL Database').requireString('id')).toBe(dbId);
			expect(copyId).not.toBe(dbId);
			expect(result.step('List After Copy').stringValues('id')).toEqual(
				expect.arrayContaining([dbId, copyId]),
			);
		},
		180_000,
	);

	testcase('lists available MySQL versions', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Database',
			operation: 'List MySQL Versions',
		});

		expect(Array.isArray(result.items)).toBe(true);
		expect(result.items.length).toBeGreaterThan(0);
	});

	testcase('lists available Redis versions', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Database',
			operation: 'List Redis Versions',
		});

		expect(Array.isArray(result.items)).toBe(true);
		expect(result.items.length).toBeGreaterThan(0);
	});
});

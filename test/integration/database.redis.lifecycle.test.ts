/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Database / Redis Lifecycle (integration)', () => {
	testcase(
		'creates, lists, gets, and deletes a Redis database in one workflow',
		async (context) => {
			const projectDescription = `it-${runId('redis-project')}`;
			const dbDescription = `it-${runId('redis-db')}`;

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
				.scenario('Redis lifecycle')
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
					name: 'Create Redis Database',
					resource: 'Database',
					operation: 'Create Redis Database',
					parameters: {
						project: fromStep('Create Project'),
						description: dbDescription,
						version: { mode: 'id', value: '7.2' },
					},
				})
				.step({
					name: 'List Redis Databases',
					resource: 'Database',
					operation: 'List Redis Databases',
					parameters: { project: fromStep('Create Project') },
				})
				.step({
					name: 'Get Redis Database',
					resource: 'Database',
					operation: 'Get Redis Database',
					parameters: { redisDatabaseId: fromStep('Create Redis Database').value },
				})
				.step({
					name: 'Delete Redis Database',
					resource: 'Database',
					operation: 'Delete Redis Database',
					parameters: { redisDatabaseId: fromStep('Create Redis Database').value },
				})
				.step({
					name: 'List After Delete',
					resource: 'Database',
					operation: 'List Redis Databases',
					parameters: { project: fromStep('Create Project') },
				})
				.run();

			const dbId = result.step('Create Redis Database').requireString('id');

			expect(result.step('List Redis Databases').stringValues('id')).toContain(dbId);
			expect(result.step('Get Redis Database').requireString('id')).toBe(dbId);
			expect(result.step('Get Redis Database').requireString('description')).toBe(dbDescription);
			expect(result.step('List After Delete').stringValues('id')).not.toContain(dbId);
		},
		180_000,
	);
});

/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Container / Service lifecycle (integration)', () => {
	testcase(
		'creates two services in a project and deletes them',
		async (context) => {
			const projectDescription = `it-${runId('container-lifecycle')}`;

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
				.scenario('Container service lifecycle')
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
					name: 'Create Postgres Service',
					resource: 'Container',
					operation: 'Create Service',
					parameters: {
						project: fromStep('Create Project'),
						serviceName: 'postgres',
						image: 'postgres:16',
						description: 'PostgreSQL service',
					},
				})
				.step({
					name: 'Create n8n Service',
					resource: 'Container',
					operation: 'Create Service',
					parameters: {
						project: fromStep('Create Project'),
						serviceName: 'n8n',
						image: 'docker.n8n.io/n8nio/n8n',
						description: 'n8n service',
					},
				})
				.step({
					name: 'List Services',
					resource: 'Container',
					operation: 'List Services',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.step({
					name: 'Delete Postgres Service',
					resource: 'Container',
					operation: 'Delete Service',
					parameters: {
						project: fromStep('Create Project'),
						serviceName: 'postgres',
					},
				})
				.step({
					name: 'Delete n8n Service',
					resource: 'Container',
					operation: 'Delete Service',
					parameters: {
						project: fromStep('Create Project'),
						serviceName: 'n8n',
					},
				})
				.step({
					name: 'List Services After Delete',
					resource: 'Container',
					operation: 'List Services',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.run();

			const serviceNames = result.step('List Services').stringValues('serviceName');
			expect(serviceNames).toContain('postgres');
			expect(serviceNames).toContain('n8n');

			const remaining = result.step('List Services After Delete').stringValues('serviceName');
			expect(remaining).not.toContain('postgres');
			expect(remaining).not.toContain('n8n');
		},
		180_000,
	);
});

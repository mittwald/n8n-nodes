/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Container / Read (integration)', () => {
	testcase(
		'lists container resources in a project',
		async (context) => {
			const projectDescription = `it-${runId('container-project')}`;

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

			const setup = await context
				.scenario('Container project setup')
				.step({
					name: 'Create Project',
					resource: 'Project',
					operation: 'Create',
					parameters: {
						server: { mode: 'id', value: context.env.testServerId },
						description: projectDescription,
					},
				})
				.run();

			const projectId = setup.step('Create Project').requireString('id');

			const services = await context.runOperation({
				resource: 'Container',
				operation: 'List Services',
				parameters: { project: { mode: 'id', value: projectId } },
				allowEmptyItems: true,
			});

			const volumes = await context.runOperation({
				resource: 'Container',
				operation: 'List Volumes',
				parameters: { project: { mode: 'id', value: projectId } },
				allowEmptyItems: true,
			});

			const registries = await context.runOperation({
				resource: 'Container',
				operation: 'List Registries',
				parameters: { project: { mode: 'id', value: projectId } },
				allowEmptyItems: true,
			});

			expect(Array.isArray(services.items)).toBe(true);
			expect(Array.isArray(volumes.items)).toBe(true);
			expect(Array.isArray(registries.items)).toBe(true);
		},
		60_000,
	);
});

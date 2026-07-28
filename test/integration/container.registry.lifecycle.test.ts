/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Container / Registry lifecycle (integration)', () => {
	testcase(
		'creates, lists, updates, and deletes a container registry',
		async (context) => {
			const projectDescription = `it-${runId('registry-project')}`;
			const registryDescription = `it-${runId('registry')}`;
			// A new project is seeded with ghcr.io, index.docker.io and registry.gitlab.com,
			// and the API rejects hostnames it cannot reach — so the test needs a real
			// registry that is not one of the defaults.
			const registryUri = 'quay.io';
			const updatedDescription = `${registryDescription}-updated`;

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
				.scenario('Container registry lifecycle')
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
					name: 'Create Registry',
					resource: 'Container',
					operation: 'Create Registry',
					parameters: {
						project: fromStep('Create Project'),
						uri: registryUri,
						registryDescription,
					},
				})
				.step({
					name: 'List Registries',
					resource: 'Container',
					operation: 'List Registries',
					parameters: { project: fromStep('Create Project') },
				})
				.step({
					name: 'Update Registry',
					resource: 'Container',
					operation: 'Update Registry',
					parameters: {
						project: fromStep('Create Project'),
						registry: fromStep('Create Registry'),
						registryDescription: updatedDescription,
					},
				})
				.step({
					name: 'List Registries After Update',
					resource: 'Container',
					operation: 'List Registries',
					parameters: { project: fromStep('Create Project') },
				})
				.run();

			const projectId = result.step('Create Project').requireString('id');
			const registryId = result.step('Create Registry').requireString('id');

			expect(result.step('List Registries').stringValues('id')).toContain(registryId);
			expect(result.step('Update Registry').first()).toBeDefined();
			expect(result.step('List Registries After Update').stringValues('description')).toContain(
				updatedDescription,
			);

			// Deleting runs on its own rather than as a further workflow step: a node that
			// follows a list step is executed once per returned item, so the repeat runs
			// would target an already-deleted registry.
			const deleted = await context.runOperation({
				resource: 'Container',
				operation: 'Delete Registry',
				parameters: {
					project: { mode: 'id', value: projectId },
					registry: { mode: 'id', value: registryId },
				},
			});
			expect(deleted.items.length).toBeGreaterThan(0);

			const remaining = await context.runOperation({
				resource: 'Container',
				operation: 'List Registries',
				parameters: { project: { mode: 'id', value: projectId } },
			});
			expect(remaining.items.map((item) => item.json.id)).not.toContain(registryId);
		},
		180_000,
	);
});

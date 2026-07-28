/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Container / Service update and actions (integration)', () => {
	testcase(
		'updates a service, runs an action on it, and reads its logs',
		async (context) => {
			const projectDescription = `it-${runId('service-update')}`;
			const serviceName = 'nginx';

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
				.scenario('Container service update')
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
					name: 'Create Service',
					resource: 'Container',
					operation: 'Create Service',
					parameters: {
						project: fromStep('Create Project'),
						serviceName,
						image: 'nginx:1.27-alpine',
						description: 'Service before update',
					},
				})
				.step({
					name: 'Update Service',
					resource: 'Container',
					operation: 'Update Service',
					parameters: {
						project: fromStep('Create Project'),
						serviceName,
						image: 'nginx:1.28-alpine',
						description: 'Service after update',
					},
				})
				.step({
					name: 'List Services After Update',
					resource: 'Container',
					operation: 'List Services',
					parameters: { project: fromStep('Create Project') },
				})
				.step({
					name: 'Stop Service',
					resource: 'Container',
					operation: 'Service Action',
					parameters: {
						project: fromStep('Create Project'),
						serviceId: fromStep('Create Service').value,
						action: 'stop',
					},
				})
				.step({
					name: 'Start Service',
					resource: 'Container',
					operation: 'Service Action',
					parameters: {
						project: fromStep('Create Project'),
						serviceId: fromStep('Create Service').value,
						action: 'start',
					},
				})
				.step({
					name: 'Get Service Logs',
					resource: 'Container',
					operation: 'Get Service Logs',
					parameters: {
						project: fromStep('Create Project'),
						serviceId: fromStep('Create Service').value,
						tail: 20,
					},
				})
				.step({
					name: 'Delete Service',
					resource: 'Container',
					operation: 'Delete Service',
					parameters: {
						project: fromStep('Create Project'),
						serviceName,
					},
				})
				.run();

			const updated = result
				.step('List Services After Update')
				.items()
				.find((item) => item.json.serviceName === serviceName);

			expect(updated, `service "${serviceName}" is missing after the update`).toBeDefined();
			expect(updated?.json.description).toBe('Service after update');
			// Both operations answer with the touched service, so their `id` can be
			// chained into every operation taking a service ID.
			expect(result.step('Create Service').requireString('id')).toBe(updated?.json.id);
			expect(result.step('Update Service').requireString('description')).toBe(
				'Service after update',
			);
			expect(result.step('Stop Service').first()).toBeDefined();
			expect(result.step('Start Service').first()).toBeDefined();
			expect(result.step('Get Service Logs').first()).toBeDefined();
		},
		240_000,
	);
});

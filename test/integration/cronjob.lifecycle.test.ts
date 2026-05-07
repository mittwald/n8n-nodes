/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Cronjob / Lifecycle (integration)', () => {
	testcase('creates, lists, gets, triggers, and deletes a cronjob', async (context) => {
		const projectDescription = `it-${runId('cronjob-project')}`;
		const cronjobDescription = `it-${runId('cronjob')}`;

		context.teardown(async () => {
			const response = await context.mittwaldApi.project.listProjects();

			if (response.status !== 200) {
				throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
			}

			const project = response.data.find(
				(entry: { description: string; id: string }) => entry.description === projectDescription,
			);
			if (project) {
				await context.mittwaldApi.project.deleteProject({ projectId: project.id });
			}
		});

		const result = await context
			.scenario('Cronjob lifecycle')
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
				name: 'Create Cronjob',
				resource: 'Cronjob',
				operation: 'Create',
				parameters: {
					project: fromStep('Create Project'),
					description: cronjobDescription,
					interval: '0 0 * * *',
					active: true,
					timeout: 300,
					destinationType: 'url',
					url: 'https://example.com/',
				},
			})
			.step({
				name: 'List Cronjobs',
				resource: 'Cronjob',
				operation: 'List',
				parameters: {
					project: fromStep('Create Project'),
				},
			})
			.step({
				name: 'Get Cronjob',
				resource: 'Cronjob',
				operation: 'Get',
				parameters: {
					cronjobId: fromStep('Create Cronjob'),
				},
			})
			.step({
				name: 'Trigger Cronjob',
				resource: 'Cronjob',
				operation: 'Trigger',
				parameters: {
					cronjobId: fromStep('Create Cronjob'),
				},
			})
			.step({
				name: 'List Executions',
				resource: 'Cronjob',
				operation: 'List Executions',
				parameters: {
					cronjobId: fromStep('Create Cronjob'),
				},
			})
			.step({
				name: 'Get Execution',
				resource: 'Cronjob',
				operation: 'Get Execution',
				parameters: {
					cronjobId: fromStep('Create Cronjob'),
					executionId: fromStep('Trigger Cronjob'),
				},
			})
			.step({
				name: 'Delete Cronjob',
				resource: 'Cronjob',
				operation: 'Delete',
				parameters: {
					cronjobId: fromStep('Create Cronjob'),
				},
			})
			.run();

		const cronjobId = result.step('Create Cronjob').requireString('id');
		const executionId = result.step('Trigger Cronjob').requireString('id');

		expect(result.step('List Cronjobs').stringValues('id')).toContain(cronjobId);
		expect(result.step('Get Cronjob').requireString('id')).toBe(cronjobId);
		expect(result.step('Get Cronjob').requireString('description')).toBe(cronjobDescription);
		expect(result.step('List Executions').stringValues('id')).toContain(executionId);
		expect(result.step('Get Execution').requireString('id')).toBe(executionId);
	});
});

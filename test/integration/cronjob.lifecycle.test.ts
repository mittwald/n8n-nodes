/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, getLatestWordPressInstallInput, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Cronjob / Lifecycle (integration)', () => {
	testcase('creates, lists, gets, triggers, and deletes a cronjob', async (context) => {
		const projectDescription = `it-${runId('cronjob-project')}`;
		const cronjobDescription = `it-${runId('cronjob')}`;
		const installDescription = `it-${runId('cronjob-install')}`;
		const installationPath = `/html/${runId('wp').slice(0, 8)}`;
		const wordpress = await getLatestWordPressInstallInput({
			mittwaldApi: context.mittwaldApi,
			hostDomain: `${runId('wp')}.project.space`,
			siteTitle: `WP ${runId('site')}`,
		});

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
				name: 'Install WordPress',
				resource: 'App',
				operation: 'Install',
				parameters: {
					project: fromStep('Create Project'),
					app: { mode: 'id', value: wordpress.app.id },
					version: { mode: 'id', value: wordpress.version.id },
					description: installDescription,
					installationPath,
					versionConfig: wordpress.versionConfig,
					waitUntilInstalled: true,
				},
			})
			.step({
				name: 'Create Cronjob',
				resource: 'Cronjob',
				operation: 'Create',
				parameters: {
					project: fromStep('Create Project'),
					appInstallation: fromStep('Install WordPress'),
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
					cronjobId: fromStep('Create Cronjob').value,
				},
			})
			.step({
				name: 'Trigger Cronjob',
				resource: 'Cronjob',
				operation: 'Trigger',
				parameters: {
					cronjobId: fromStep('Create Cronjob').value,
				},
			})
			.step({
				name: 'List Executions',
				resource: 'Cronjob',
				operation: 'List Executions',
				parameters: {
					cronjobId: fromStep('Create Cronjob').value,
				},
			})
			.step({
				name: 'Get Execution',
				resource: 'Cronjob',
				operation: 'Get Execution',
				parameters: {
					cronjobId: fromStep('Create Cronjob').value,
					executionId: fromStep('Trigger Cronjob').value,
				},
			})
			.step({
				name: 'Delete Cronjob',
				resource: 'Cronjob',
				operation: 'Delete',
				parameters: {
					cronjobId: fromStep('Create Cronjob').value,
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
	}, 300_000);
});

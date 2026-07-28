/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, getLatestWordPressInstallInput, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('App / Installation lifecycle (integration)', () => {
	testcase(
		'installs an app, copies the installation, and uninstalls it',
		async (context) => {
			const projectDescription = `it-${runId('app-project')}`;
			const installDescription = `it-${runId('app-install')}`;
			const copyDescription = `${installDescription}-copy`;
			const installationPath = `/html/${runId('app').slice(0, 8)}`;
			const copyPath = `/html/${runId('copy').slice(0, 8)}`;
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
				const project = response.data.find((entry) => entry.description === projectDescription);
				if (project) {
					await context.mittwaldApi.project.deleteProject({ projectId: project.id });
				}
			});

			// Write steps deliberately follow single-item steps: a node placed after a
			// list step is executed once per returned item.
			const result = await context
				.scenario('App installation lifecycle')
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
					name: 'Install App',
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
					name: 'Get Installation',
					resource: 'App',
					operation: 'Get Installation',
					parameters: { appInstallation: fromStep('Install App') },
				})
				.step({
					name: 'Request Installation Copy',
					resource: 'App',
					operation: 'Request Installation Copy',
					parameters: {
						appInstallation: fromStep('Install App'),
						project: fromStep('Create Project'),
						description: copyDescription,
						installationPath: copyPath,
					},
				})
				.step({
					name: 'List Installations By Project',
					resource: 'App',
					operation: 'List Installations By Project',
					parameters: { project: fromStep('Create Project') },
				})
				.run();

			const projectId = result.step('Create Project').requireString('id');
			const installationId = result.step('Install App').requireString('id');

			expect(result.step('Get Installation').requireString('id')).toBe(installationId);
			expect(result.step('Get Installation').requireString('description')).toBe(
				installDescription,
			);
			expect(result.step('Request Installation Copy').first()).toBeDefined();
			expect(result.step('List Installations By Project').stringValues('id')).toContain(
				installationId,
			);

			const uninstalled = await context.runOperation({
				resource: 'App',
				operation: 'Uninstall',
				parameters: { appInstallation: { mode: 'id', value: installationId } },
			});
			expect(uninstalled.items.length).toBeGreaterThan(0);

			const remaining = await context.runOperation({
				resource: 'App',
				operation: 'List Installations By Project',
				parameters: { project: { mode: 'id', value: projectId } },
				allowEmptyItems: true,
			});
			expect(remaining.items.map((item) => item.json.id)).not.toContain(installationId);
		},
		300_000,
	);
});

/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, getLatestWordPressInstallInput, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Domain / Create (WordPress subdomain)', () => {
	testcase(
		'creates a project.space subdomain for a WordPress installation',
		async (context) => {
			const projectDescription = `it-${runId('domain-project')}`;
			const installDescription = `it-${runId('domain-install')}`;
			const installationPath = `/html/${runId('wp').slice(0, 8)}`;
			const subdomain = `${runId('wp')}.project.space`;
			const wordpress = await getLatestWordPressInstallInput({
				mittwaldApi: context.mittwaldApi,
				hostDomain: subdomain,
				siteTitle: `WP ${runId('site')}`,
			});

			const result = await context
				.scenario('Install WordPress before creating domain')
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
						app: {
							mode: 'id',
							value: wordpress.app.id,
						},
						version: {
							mode: 'id',
							value: wordpress.version.id,
						},
						description: installDescription,
						installationPath,
						versionConfig: wordpress.versionConfig,
						waitUntilInstalled: true,
					},
				})
				.step({
					name: 'Create Domain',
					resource: 'Domain',
					operation: 'Create',
					parameters: {
						fullName: subdomain,
						targetInstallation: fromStep('Install WordPress'),
					},
				})
				.run();

			const projectId = result.step('Create Project').requireString('id');
			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});
			const domainId = result.step('Create Domain').requireString('id');

			expect(domainId).toBeTruthy();
		},
		180_000,
	);
});

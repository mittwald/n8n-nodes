/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import {
	createMittwaldWorkflow,
	getLatestWordPressInstallInput,
	nodeIdReference,
	runId,
} from './helpers';
import { integrationDescribe, readOptionalString, readRequiredString, testcase } from './testcase';

integrationDescribe('App / Install WordPress (integration)', () => {
	testcase(
		'installs the latest WordPress version on a new project',
		async (context) => {
			const projectDescription = `it-${runId('wp-project')}`;
			const installDescription = `it-${runId('wp-install')}`;
			const installationPath = `/html/${runId('wp').slice(0, 8)}`;
			const wordpress = await getLatestWordPressInstallInput({
				mittwaldApi: context.mittwaldApi,
				hostDomain: `${runId('wp')}.project.space`,
				siteTitle: `WP ${runId('site')}`,
			});

			const createProjectStep = {
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
			} as const;
			const installStep = {
				name: 'Install WordPress',
				resource: 'App',
				operation: 'Install',
				parameters: {
					project: nodeIdReference(createProjectStep.name),
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
			} as const;

			const result = await context.runWorkflow({
				workflow: createMittwaldWorkflow(context.env, [createProjectStep, installStep]),
			});

			const createdItems = result.getNodeItems(createProjectStep.name, { allowEmpty: false });
			const projectId = readRequiredString(createdItems[0]?.json ?? {}, 'id');
			context.teardown(async () => {
				await context.mittwaldApi.deleteProject(projectId);
			});

			const installedItems = result.getNodeItems(installStep.name, { allowEmpty: false });
			expect(readOptionalString(installedItems[0]?.json ?? {}, 'phase')).toBeDefined();

			const installation = await context.mittwaldApi.waitForAppInstallationByDescription({
				description: installDescription,
			});
			expect(installation.id).toBeTruthy();
		},
		180_000,
	);
});

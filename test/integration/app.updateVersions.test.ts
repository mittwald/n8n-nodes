/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, getLatestWordPressInstallInput, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

/** An empty resource mapper value: keep the system software versions as they are. */
const noSystemSoftwareChanges = {
	mappingMode: 'defineBelow',
	value: {},
	matchingColumns: [],
	schema: [],
	attemptToConvertTypes: false,
	convertFieldsToString: false,
};

integrationDescribe('App / Update installation versions (integration)', () => {
	testcase(
		'installs an outdated app version and updates it to the latest',
		async (context) => {
			const projectDescription = `it-${runId('app-update-project')}`;
			const installDescription = `it-${runId('app-update')}`;
			const installationPath = `/html/${runId('upd').slice(0, 8)}`;
			const hostDomain = `${runId('wp')}.project.space`;
			const siteTitle = `WP ${runId('site')}`;

			const outdated = await getLatestWordPressInstallInput({
				mittwaldApi: context.mittwaldApi,
				hostDomain,
				siteTitle,
				versionOffsetFromLatest: 1,
			});
			const latest = await getLatestWordPressInstallInput({
				mittwaldApi: context.mittwaldApi,
				hostDomain,
				siteTitle,
			});

			expect(
				latest.version.id,
				'the account needs at least two WordPress versions for this test',
			).not.toBe(outdated.version.id);

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
				.scenario('App version update')
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
					name: 'Install Outdated App',
					resource: 'App',
					operation: 'Install',
					parameters: {
						project: fromStep('Create Project'),
						app: { mode: 'id', value: outdated.app.id },
						version: { mode: 'id', value: outdated.version.id },
						description: installDescription,
						installationPath,
						versionConfig: outdated.versionConfig,
						waitUntilInstalled: true,
					},
				})
				.step({
					name: 'Update Installation Versions',
					resource: 'App',
					operation: 'Update Installation Versions',
					parameters: {
						appInstallation: fromStep('Install Outdated App'),
						version: { mode: 'id', value: latest.version.id },
						systemSoftware: noSystemSoftwareChanges,
					},
				})
				.run();

			const installationId = result.step('Install Outdated App').requireString('id');
			const updated = result.step('Update Installation Versions').first();

			expect(updated?.json.id).toBe(installationId);

			const appVersion = updated?.json.appVersion;
			if (typeof appVersion !== 'object' || appVersion === null) {
				throw new Error('Expected the updated installation to expose an appVersion object');
			}

			// The update is asynchronous: the API records the target as `desired` and
			// only moves it to `current` once the installation has been upgraded.
			expect('desired' in appVersion ? appVersion.desired : undefined).toBe(latest.version.id);
		},
		300_000,
	);
});

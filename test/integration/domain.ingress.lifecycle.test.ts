/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, getLatestWordPressInstallInput, runId } from './helpers';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

integrationDescribe('Domain / Ingress lifecycle (integration)', () => {
	testcase(
		'points a subdomain at an installation and removes the ingress',
		async (context) => {
			const baseDomain = context.env.domain;
			if (!baseDomain) {
				// Needs a domain registered on the test account; skip when unconfigured.
				return;
			}

			const projectDescription = `it-${runId('ingress-project')}`;
			const installDescription = `it-${runId('ingress-install')}`;
			const installationPath = `/html/${runId('ing').slice(0, 8)}`;
			const subdomain = `${runId('ing').replace(/[^a-z0-9-]/g, '')}.${baseDomain}`;
			const wordpress = await getLatestWordPressInstallInput({
				mittwaldApi: context.mittwaldApi,
				hostDomain: subdomain,
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

			const result = await context
				.scenario('Domain ingress lifecycle')
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
					name: 'Create Domain',
					resource: 'Domain',
					operation: 'Create',
					parameters: {
						fullName: subdomain,
						targetInstallation: fromStep('Install App'),
					},
				})
				.run();

			const projectId = result.step('Create Project').requireString('id');
			const installationId = result.step('Install App').requireString('id');
			// Create Domain returns the ingress it created for the subdomain.
			const ingressId = result.step('Create Domain').requireString('id');

			const ingress = await context.runOperation({
				resource: 'Domain',
				operation: 'Get Ingress',
				parameters: { ingressId },
			});
			expect(readRequiredString(ingress.firstItem.json, 'hostname')).toBe(subdomain);

			// Verify Ingress Ownership is not exercised here: the hostname belongs to a
			// domain managed in this account, so the ingress is already verified and the
			// operation answers 412 with an empty TXT challenge.
			const retargeted = await context.runOperation({
				resource: 'Domain',
				operation: 'Set Target',
				parameters: {
					ingress: { mode: 'id', value: ingressId },
					targetInstallation: { mode: 'id', value: installationId },
				},
			});
			expect(retargeted.items.length).toBeGreaterThan(0);

			const deleted = await context.runOperation({
				resource: 'Domain',
				operation: 'Delete Ingress',
				parameters: { ingressId },
			});
			expect(deleted.items.length).toBeGreaterThan(0);

			const remaining = await context.runOperation({
				resource: 'Domain',
				operation: 'List Ingresses',
				parameters: { project: { mode: 'id', value: projectId } },
				allowEmptyItems: true,
			});
			expect(remaining.items.map((item) => item.json.id)).not.toContain(ingressId);
		},
		300_000,
	);
});

/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { setTimeout as sleep } from 'node:timers/promises';
import { runId } from './helpers';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

integrationDescribe('Domain / Ingress ownership (integration)', () => {
	testcase(
		'reports an unverified ingress together with the expected TXT record',
		async (context) => {
			const projectDescription = `it-${runId('ownership-project')}`;
			// A hostname outside the account: an ingress for a domain managed here is
			// verified on creation, so the TXT challenge would never be pending.
			const externalHostname = `${runId('ext')}.example.org`;

			const created = await context.mittwaldApi.project.createProject({
				serverId: context.env.testServerId,
				data: { description: projectDescription },
			});
			if (created.status !== 201) {
				throw new Error(`Failed to create project: ${created.statusText}`);
			}
			const projectId = created.data.id;
			context.teardown(async () => {
				const removed = await context.mittwaldApi.project.deleteProject({ projectId });
				if (removed.status !== 204 && removed.status !== 200) {
					throw new Error(`Failed to delete project ${projectId} (status ${removed.status})`);
				}
			});

			// A freshly created project is not immediately authorised for follow-up calls;
			// wait until it can be read before using it.
			for (let attempt = 0; attempt < 20; attempt += 1) {
				const project = await context.mittwaldApi.project.getProject({ projectId });
				if (project.status === 200) {
					break;
				}
				await sleep(1000);
			}

			// The node has no operation for connecting an externally hosted domain, so the
			// ingress is set up through the API client.
			const ingress = await context.mittwaldApi.domain.ingressCreateIngress({
				data: {
					projectId,
					hostname: externalHostname,
					paths: [{ path: '/', target: { useDefaultPage: true } }],
				},
			});
			if (ingress.status !== 201) {
				throw new Error(`Failed to create ingress: ${ingress.statusText}`);
			}
			const ingressId = ingress.data.id;

			const result = await context.runOperation({
				resource: 'Domain',
				operation: 'Verify Ingress Ownership',
				parameters: { ingressId },
			});

			expect(result.firstItem.json.verified).toBe(false);
			expect(readRequiredString(result.firstItem.json, 'hostname')).toBe(externalHostname);
			expect(readRequiredString(result.firstItem.json, 'expectedTxtRecord')).toContain(
				'domainVerification=',
			);
		},
		180_000,
	);
});

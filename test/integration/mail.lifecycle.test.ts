/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Mail / Lifecycle (integration)', () => {
	testcase(
		'creates, lists, gets and deletes a mail address',
		async (context) => {
			const projectDescription = `it-${runId('mail-project')}`;
			const localPart = `it-${runId('mail')}`;

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

			const projectStep = await context
				.scenario('Mail lifecycle setup')
				.step({
					name: 'Create Project',
					resource: 'Project',
					operation: 'Create',
					parameters: {
						server: { mode: 'id', value: context.env.testServerId },
						description: projectDescription,
					},
				})
				.run();

			const projectId = projectStep.step('Create Project').requireString('id');

			const projectResponse = await context.mittwaldApi.project.getProject({ projectId });
			if (projectResponse.status !== 200) {
				throw new Error(`Failed to get project during test setup: ${projectResponse.statusText}`);
			}

			const domainsResponse = await context.mittwaldApi.domain.listDomains({
				queryParameters: { projectId },
			});
			if (domainsResponse.status !== 200 || domainsResponse.data.length === 0) {
				return;
			}

			const address = `${localPart}@${domainsResponse.data[0].domain}`;

			const result = await context
				.scenario('Mail address lifecycle')
				.step({
					name: 'Create Mail Address',
					resource: 'Mail',
					operation: 'Create Mail Address',
					parameters: {
						project: { mode: 'id', value: projectId },
						address,
						password: `S3cure!${runId('pw')}`,
						quotaInBytes: 0,
						forwardAddresses: '',
						catchAll: false,
						enableSpamProtection: true,
						autoResponderActive: false,
						autoResponderMessage: '',
					},
				})
				.step({
					name: 'List Mail Addresses By Project',
					resource: 'Mail',
					operation: 'List Mail Addresses By Project',
					parameters: { project: { mode: 'id', value: projectId } },
				})
				.step({
					name: 'Get Mail Address',
					resource: 'Mail',
					operation: 'Get Mail Address',
					parameters: { mailAddressId: fromStep('Create Mail Address') },
				})
				.step({
					name: 'Delete Mail Address',
					resource: 'Mail',
					operation: 'Delete Mail Address',
					parameters: { mailAddressId: fromStep('Create Mail Address') },
				})
				.run();

			const addressId = result.step('Create Mail Address').requireString('id');

			expect(result.step('List Mail Addresses By Project').stringValues('id')).toContain(addressId);
			expect(result.step('Get Mail Address').requireString('id')).toBe(addressId);
		},
		60_000,
	);

	testcase('lists mail addresses for the user', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Mail',
			operation: 'List Mail Addresses',
		});

		expect(Array.isArray(result.items)).toBe(true);
	});
});

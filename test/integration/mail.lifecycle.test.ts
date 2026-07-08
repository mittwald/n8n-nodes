/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Mail / Lifecycle (integration)', () => {
	testcase(
		'creates, updates, renames and deletes a mail address',
		async (context) => {
			const projectDescription = `it-${runId('mail-project')}`;
			const localPart = `it-${runId('mail')}`;
			const renamedLocalPart = `${localPart}-renamed`;

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

			const domain = domainsResponse.data[0].domain;
			const address = `${localPart}@${domain}`;
			const renamedAddress = `${renamedLocalPart}@${domain}`;

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
					name: 'Update Mail Address Autoresponder',
					resource: 'Mail',
					operation: 'Update Mail Address Autoresponder',
					parameters: {
						mailAddressId: fromStep('Create Mail Address'),
						active: true,
						message: 'integration test autoresponder',
						startsAt: '',
						expiresAt: '',
					},
				})
				.step({
					name: 'Update Mail Address',
					resource: 'Mail',
					operation: 'Update Mail Address',
					parameters: {
						mailAddressId: fromStep('Create Mail Address'),
						address: renamedAddress,
					},
				})
				.step({
					name: 'Get Renamed Mail Address',
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
			expect(result.step('Get Renamed Mail Address').requireString('address')).toBe(renamedAddress);
		},
		120_000,
	);

	testcase(
		'creates, lists, gets and deletes a delivery box',
		async (context) => {
			const projectDescription = `it-${runId('deliverybox-project')}`;
			const boxDescription = `it-${runId('deliverybox')}`;

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
				.scenario('Delivery box lifecycle')
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
					name: 'Create Delivery Box',
					resource: 'Mail',
					operation: 'Create Delivery Box',
					parameters: {
						project: fromStep('Create Project'),
						description: boxDescription,
						password: `S3cure!${runId('pw')}`,
					},
				})
				.step({
					name: 'List Delivery Boxes',
					resource: 'Mail',
					operation: 'List Delivery Boxes',
					parameters: { project: fromStep('Create Project') },
				})
				.step({
					name: 'Get Delivery Box',
					resource: 'Mail',
					operation: 'Get Delivery Box',
					parameters: { deliveryBoxId: fromStep('Create Delivery Box').value },
				})
				.step({
					name: 'Delete Delivery Box',
					resource: 'Mail',
					operation: 'Delete Delivery Box',
					parameters: { deliveryBoxId: fromStep('Create Delivery Box').value },
				})
				.run();

			const boxId = result.step('Create Delivery Box').requireString('id');

			expect(result.step('List Delivery Boxes').stringValues('id')).toContain(boxId);
			expect(result.step('Get Delivery Box').requireString('id')).toBe(boxId);
		},
		90_000,
	);

	testcase('lists mail addresses for the user', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Mail',
			operation: 'List Mail Addresses',
		});

		expect(Array.isArray(result.items)).toBe(true);
	});
});

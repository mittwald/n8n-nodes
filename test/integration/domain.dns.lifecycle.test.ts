/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { fromStep, runId } from './helpers';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Domain / DNS lifecycle (integration)', () => {
	testcase(
		'lists and gets a DNS zone within a freshly created project',
		async (context) => {
			const description = `it-${runId('dns-project')}`;

			context.teardown(async () => {
				const response = await context.mittwaldApi.project.listProjects();

				if (response.status !== 200) {
					throw new Error(`Failed to list projects during teardown: ${response.statusText}`);
				}

				const project = response.data.find((entry) => entry.description === description);
				if (project) {
					await context.mittwaldApi.project.deleteProject({ projectId: project.id });
				}
			});

			const result = await context
				.scenario('DNS zone read lifecycle')
				.step({
					name: 'Create Project',
					resource: 'Project',
					operation: 'Create',
					parameters: {
						server: {
							mode: 'id',
							value: context.env.testServerId,
						},
						description,
					},
				})
				.step({
					name: 'List DNS Zones',
					resource: 'Domain',
					operation: 'List DNS Zones',
					parameters: {
						project: fromStep('Create Project'),
					},
				})
				.run();

			const zoneIds = result
				.step('List DNS Zones')
				.items({ allowEmpty: true })
				.map((item) => {
					const id = item.json['id'];

					return typeof id === 'string' ? id : undefined;
				})
				.filter((id): id is string => Boolean(id));

			if (zoneIds.length === 0) {
				return;
			}

			const firstZoneId = zoneIds[0];

			const getResult = await context
				.scenario('Get DNS zone by id')
				.step({
					name: 'Get DNS Zone',
					resource: 'Domain',
					operation: 'Get DNS Zone',
					parameters: {
						dnsZoneId: firstZoneId,
					},
				})
				.run();

			expect(getResult.step('Get DNS Zone').requireString('id')).toBe(firstZoneId);
		},
		60_000,
	);
});

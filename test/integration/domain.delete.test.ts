/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Domain / Delete (integration)', () => {
	testcase(
		'deletes a domain together with its ingresses',
		async (context) => {
			const domainName = context.env.deletableDomain;
			if (!domainName) {
				// Deliberately gated behind its own variable: this consumes the domain and
				// cannot be undone, so it must never run as a side effect of another suite.
				return;
			}

			const listed = await context.mittwaldApi.domain.listDomains({});
			if (listed.status !== 200) {
				throw new Error(`Failed to list domains: ${listed.statusText}`);
			}
			const domain = listed.data.find((entry) => entry.domain === domainName);
			if (!domain) {
				throw new Error(`Domain "${domainName}" not found on the test account`);
			}
			const domainId = domain.domainId;

			const deleted = await context.runOperation({
				resource: 'Domain',
				operation: 'Delete',
				parameters: {
					domainId,
					transit: false,
					deleteIngresses: true,
				},
			});
			expect(deleted.items.length).toBeGreaterThan(0);

			const afterDelete = await context.mittwaldApi.domain.listDomains({});
			if (afterDelete.status !== 200) {
				throw new Error(`Failed to list domains: ${afterDelete.statusText}`);
			}
			const stillListed = afterDelete.data.find((entry) => entry.domain === domainName);
			expect(stillListed?.deleted ?? true).toBeTruthy();
		},
		180_000,
	);
});

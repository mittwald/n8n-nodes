/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Domain / Scheduled deletion (integration)', () => {
	testcase(
		'schedules a domain for deletion and cancels it again',
		async (context) => {
			const domainName = context.env.expendableDomain;
			if (!domainName) {
				// Needs a domain that may be scheduled for deletion; skip when unconfigured.
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

			// The node has no cancel operation, so the schedule is withdrawn through the
			// API client — otherwise the domain would really be deleted on the target date.
			context.teardown(async () => {
				const cancelled = await context.mittwaldApi.domain.cancelScheduledDeletion({ domainId });
				if (cancelled.status !== 204 && cancelled.status !== 200) {
					throw new Error(
						`Failed to withdraw the scheduled deletion (status ${cancelled.status}) — domain ${domainName} is still scheduled for deletion`,
					);
				}
			});

			const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

			const scheduled = await context.runOperation({
				resource: 'Domain',
				operation: 'Create Scheduled Deletion',
				parameters: {
					domainId,
					deletionDate,
					deleteIngresses: false,
				},
			});
			expect(scheduled.items.length).toBeGreaterThan(0);

			// Scheduling records `scheduledDeletionDate`; the `deleted` flag only flips
			// once the deletion has actually run.
			const afterSchedule = await context.mittwaldApi.domain.getDomain({ domainId });
			if (afterSchedule.status !== 200) {
				throw new Error(`Failed to read domain: ${afterSchedule.statusText}`);
			}
			expect(afterSchedule.data.scheduledDeletionDate).toBe(deletionDate);
		},
		180_000,
	);
});

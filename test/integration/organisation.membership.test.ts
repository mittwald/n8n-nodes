/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, testcase } from './testcase';

integrationDescribe('Organisation / Membership (integration)', () => {
	testcase(
		'removes a member from an organisation',
		async (context) => {
			const customerId = context.env.customerId;
			const memberMail = context.env.removableMemberMail;
			if (!customerId || !memberMail) {
				// Gated behind its own variable: the membership cannot be restored from
				// here — the invited user has to accept a fresh invite themselves.
				return;
			}

			const memberships = await context.mittwaldApi.customer.listMembershipsForCustomer({
				customerId,
			});
			if (memberships.status !== 200) {
				throw new Error(`Failed to list memberships: ${memberships.statusText}`);
			}

			const membership = memberships.data.find((entry) => entry.email === memberMail);
			if (!membership) {
				// Nothing to remove: either a previous run already did it, or the invite has
				// not been accepted yet. Fail loudly rather than reporting a green test that
				// exercised nothing.
				throw new Error(
					`No membership for "${memberMail}" in customer ${customerId}; invite the user and let them accept before running this test`,
				);
			}

			const deleted = await context.runOperation({
				resource: 'Organisation',
				operation: 'Delete Membership',
				parameters: { customerMembershipId: membership.id },
			});
			expect(deleted.items.length).toBeGreaterThan(0);

			const afterDelete = await context.mittwaldApi.customer.listMembershipsForCustomer({
				customerId,
			});
			if (afterDelete.status !== 200) {
				throw new Error(`Failed to list memberships: ${afterDelete.statusText}`);
			}
			expect(afterDelete.data.map((entry) => entry.email)).not.toContain(memberMail);
		},
		120_000,
	);
});

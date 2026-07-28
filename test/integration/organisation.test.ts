/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { runId } from './helpers';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

integrationDescribe('Organisation (integration)', () => {
	testcase('lists organisations', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Organisation',
			operation: 'List',
		});

		expect(Array.isArray(result.items)).toBe(true);
	});

	testcase('creates an invite and cleans it up', async (context) => {
		const inviteTarget = context.env.inviteTarget;
		if (!inviteTarget) {
			// Needs a reachable mailbox; skip when unconfigured.
			return;
		}

		// A plus-address keeps the run repeatable: inviting the plain address a second
		// time answers 409 once that user has accepted and become a member.
		const [localPart, domainPart] = inviteTarget.split('@');
		const mailAddress = `${localPart}+${runId('invite')}@${domainPart}`;

		// eslint-disable-next-line prefer-const
		let customerInviteId: string | undefined;
		context.teardown(async () => {
			if (!customerInviteId) {
				return;
			}

			await context.mittwaldApi.customer.deleteCustomerInvite({ customerInviteId });
		});

		// Pin the organisation when one is configured: the account may see several, and
		// only some of them accept invites for this token.
		const organisations = await context.runOperation({
			resource: 'Organisation',
			operation: 'List',
		});
		const customerId =
			context.env.customerId ?? readRequiredString(organisations.firstItem.json, 'customerId');

		const result = await context
			.scenario('Organisation invite')
			.step({
				name: 'Create Invite',
				resource: 'Organisation',
				operation: 'Create Invite',
				parameters: {
					organisation: {
						mode: 'id',
						value: customerId,
					},
					mailAddress,
					role: 'member',
				},
			})
			.run();

		const invite = result.step('Create Invite');
		customerInviteId = invite.requireString('id');

		expect(invite.requireString('customerId')).toBe(customerId);
		expect(invite.requireString('mailAddress')).toBe(mailAddress);
	});
});

/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
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
		const mailAddress = context.env.inviteTarget;
		if (!mailAddress) {
			throw new Error('Missing IT_INVITE_TARGET for invite tests.');
		}

		// eslint-disable-next-line prefer-const
		let customerInviteId: string | undefined;
		context.teardown(async () => {
			if (!customerInviteId) {
				return;
			}

			await context.mittwaldApi.customer.deleteCustomerInvite({ customerInviteId });
		});

		const organisations = await context.runOperation({
			resource: 'Organisation',
			operation: 'List',
		});
		const customerId = readRequiredString(organisations.firstItem.json, 'customerId');

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

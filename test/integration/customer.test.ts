/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { runId } from './helpers';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

integrationDescribe('Customer (integration)', () => {
	testcase('lists customers', async ({ runOperation }) => {
		const result = await runOperation({
			resource: 'Customer',
			operation: 'List',
		});

		expect(Array.isArray(result.items)).toBe(true);
	});

	testcase('creates an invite and cleans it up', async (context) => {
		// eslint-disable-next-line prefer-const
		let customerInviteId: string | undefined;
		context.teardown(async () => {
			if (!customerInviteId) {
				return;
			}

			await context.mittwaldApi.customer.deleteCustomerInvite({ customerInviteId });
		});

		const customers = await context.runOperation({
			resource: 'Customer',
			operation: 'List',
		});
		const customerId = readRequiredString(customers.firstItem.json, 'customerId');
		const mailAddress = `${runId('customer-invite')}@example.invalid`;

		const result = await context
			.scenario('Customer invite')
			.step({
				name: 'Create Invite',
				resource: 'Customer',
				operation: 'Create Invite',
				parameters: {
					customer: {
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

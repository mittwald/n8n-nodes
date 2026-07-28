/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { runId } from './helpers';
import { integrationDescribe, readRequiredString, testcase } from './testcase';

integrationDescribe('AI Hosting / Customer key (integration)', () => {
	testcase(
		'reads customer usage, creates a customer key, and deletes it',
		async (context) => {
			const customerId = context.env.customerId;
			if (!customerId) {
				// Needs a customer with an AI hosting profile; skip when unconfigured.
				return;
			}

			const keyName = `it-${runId('ai-customer-key')}`;

			const usage = await context.runOperation({
				resource: 'AI Hosting',
				operation: 'Get Customer Usage',
				parameters: { customerId },
			});
			expect(readRequiredString(usage.firstItem.json, 'customerId')).toBe(customerId);

			let createdKeyId: string | undefined;
			context.teardown(async () => {
				if (!createdKeyId) {
					return;
				}
				// Best effort: the test deletes the key itself, this only catches an
				// aborted run so no key is left behind in a shared organisation.
				try {
					await context.runOperation({
						resource: 'AI Hosting',
						operation: 'Delete Customer Key',
						parameters: { customerId, keyId: createdKeyId },
					});
				} catch {
					// already deleted by the test itself
				}
			});

			const created = await context.runOperation({
				resource: 'AI Hosting',
				operation: 'Create Customer Key',
				parameters: {
					customerId,
					keyName,
					createWebuiContainer: false,
				},
			});

			createdKeyId = readRequiredString(created.firstItem.json, 'keyId');

			const deleted = await context.runOperation({
				resource: 'AI Hosting',
				operation: 'Delete Customer Key',
				parameters: { customerId, keyId: createdKeyId },
			});
			expect(deleted.items.length).toBeGreaterThan(0);
			createdKeyId = undefined;
		},
		120_000,
	);
});

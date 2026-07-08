/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, readOptionalString, testcase } from './testcase';

declare const process: { env: Record<string, string | undefined> };

integrationDescribe('Contract / Invoice read operations (integration)', () => {
	testcase('lists customer invoices and fetches the first invoice when available', async ({
		runOperation,
	}) => {
		const testCustomerId = process.env.IT_CUSTOMER_ID;
		if (!testCustomerId) {
			return;
		}

		const listResult = await runOperation({
			resource: 'Contract',
			operation: 'List Invoices',
			parameters: {
				customerId: testCustomerId,
			},
			allowEmptyItems: true,
		});

		expect(Array.isArray(listResult.items)).toBe(true);

		const firstInvoiceId = listResult.items
			.map((item) => readOptionalString(item.json, 'id'))
			.find((invoiceId): invoiceId is string => Boolean(invoiceId));
		if (!firstInvoiceId) {
			return;
		}

		const getResult = await runOperation({
			resource: 'Contract',
			operation: 'Get Invoice',
			parameters: {
				invoiceId: firstInvoiceId,
			},
		});

		expect(getResult.firstItem.json.id).toBe(firstInvoiceId);
	});
});

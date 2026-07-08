/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { expect } from 'vitest';
import { integrationDescribe, readOptionalString, testcase } from './testcase';

integrationDescribe('Domain / Read (integration)', () => {
	testcase('lists domains and ingresses; gets a domain when one is available', async ({
		runOperation,
	}) => {
		const domainsResult = await runOperation({
			resource: 'Domain',
			operation: 'List',
			allowEmptyItems: true,
		});

		expect(Array.isArray(domainsResult.items)).toBe(true);

		const ingressesResult = await runOperation({
			resource: 'Domain',
			operation: 'List Ingresses',
			allowEmptyItems: true,
		});

		expect(Array.isArray(ingressesResult.items)).toBe(true);

		const firstDomainId = domainsResult.items
			.map((item) => readOptionalString(item.json, 'id'))
			.find((id): id is string => Boolean(id));

		if (firstDomainId) {
			const getResult = await runOperation({
				resource: 'Domain',
				operation: 'Get',
				parameters: {
					domainId: firstDomainId,
				},
			});

			const fetchedId = readOptionalString(getResult.items[0]?.json ?? {}, 'id');
			expect(fetchedId).toBe(firstDomainId);
		}
	});
});
